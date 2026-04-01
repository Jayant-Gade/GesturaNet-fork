import time

import pyautogui

import state as st
from config import SMOOTHING, SCROLL_SENSITIVITY, ACTIVE_ZONE_MARGIN

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0


def _smooth_cursor(raw_x: float, raw_y: float) -> tuple:
    """Apply exponential smoothing and update the global prev position."""
    alpha = st.state.smoothing
    smooth_x = st.prev_cursor_x * (1 - alpha) + raw_x * alpha
    smooth_y = st.prev_cursor_y * (1 - alpha) + raw_y * alpha
    st.prev_cursor_x = smooth_x
    st.prev_cursor_y = smooth_y
    return smooth_x, smooth_y


def _remap_to_screen(point: tuple) -> tuple:
    """
    Remap a normalized (x, y) inside the active zone margin to full screen
    coordinates.
    """
    screen_w, screen_h = pyautogui.size()
    # Sensitivity in UI is inverted: higher sensitivity = smaller margin
    m = st.state.sensitivity
    clamped_x = max(m, min(1.0 - m, point[0]))
    clamped_y = max(m, min(1.0 - m, point[1]))
    norm_x = (clamped_x - m) / (1.0 - 2 * m)
    norm_y = (clamped_y - m) / (1.0 - 2 * m)
    return norm_x * screen_w, norm_y * screen_h


# ── Gesture Handlers ──────────────────────────────────────────────────────────
def _handle_drag(smooth_x: float, smooth_y: float) -> None:
    """
    Drag start: press and hold the mouse button at the cursor position.
    On subsequent frames while dragging, move the cursor with the button held.
    pyautogui.mouseDown() is idempotent — safe to call every frame.
    """
    if not st.is_dragging:
        pyautogui.mouseDown(smooth_x, smooth_y, button="left")
        st.is_dragging = True
    else:
        pyautogui.moveTo(smooth_x, smooth_y)
    st.pinch_was_held = False
    st.click_fired = False
    st.scroll_prev_y = None
    st.state.gesture = "drag"


def _handle_drop(smooth_x: float, smooth_y: float) -> None:
    """
    Drop: release the mouse button at current position.
    Only fires mouseUp on the first frame of the drop gesture to avoid
    repeated release calls.
    """
    if st.is_dragging:
        pyautogui.mouseUp(smooth_x, smooth_y, button="left")
        st.is_dragging = False
    st.pinch_was_held = False
    st.click_fired = False
    st.scroll_prev_y = None
    st.state.gesture = "drop"


def _handle_left_click(smooth_x: float, smooth_y: float) -> None:
    """Left click fires only once when index & thumb pinch together."""
    # Safety: release drag if still holding
    if st.is_dragging:
        pyautogui.mouseUp(smooth_x, smooth_y, button="left")
        st.is_dragging = False
    
    # Fire click only if we just transitioned INTO left_click state
    if st.prev_gesture != "left_click":
        pyautogui.click(smooth_x, smooth_y)
        st.click_fired = True
    
    st.state.gesture = "left_click"
    st.pinch_was_held = False
    st.scroll_prev_y = None


def _handle_right_click(smooth_x: float, smooth_y: float) -> None:
    """Right click fires only once when middle & thumb pinch together."""
    # Safety: release drag if still holding
    if st.is_dragging:
        pyautogui.mouseUp(smooth_x, smooth_y, button="left")
        st.is_dragging = False
    
    # Fire click only if we just transitioned INTO right_click state
    if st.prev_gesture != "right_click":
        pyautogui.click(smooth_x, smooth_y, button="right")
        st.click_fired = True
    
    st.state.gesture = "right_click"
    st.pinch_was_held = False
    st.scroll_prev_y = None


def _handle_double_click(smooth_x: float, smooth_y: float) -> None:
    """Double click fires only once when ring & thumb pinch together."""
    # Safety: release drag if still holding
    if st.is_dragging:
        pyautogui.mouseUp(smooth_x, smooth_y, button="left")
        st.is_dragging = False
    
    # Fire double click only if we just transitioned INTO double_click state
    if st.prev_gesture != "double_click":
        pyautogui.doubleClick(smooth_x, smooth_y)
        st.click_fired = True
    
    st.state.gesture = "double_click"
    st.pinch_was_held = False
    st.scroll_prev_y = None


def _handle_move(smooth_x: float, smooth_y: float) -> None:
    """Move cursor when index & middle fingers are together (8 & 12 pinch)."""
    # Safety: if a drag was somehow abandoned, release the mouse button
    if st.is_dragging:
        pyautogui.mouseUp(smooth_x, smooth_y, button="left")
        st.is_dragging = False
    pyautogui.moveTo(smooth_x, smooth_y)
    st.pinch_was_held = False
    st.click_fired = False
    st.scroll_prev_y = None
    st.state.gesture = "move"


def _handle_open(smooth_x: float, smooth_y: float) -> None:
    """Open hand (no gesture) — just update state."""
    # Safety: release drag if hand opens fully
    if st.is_dragging:
        pyautogui.mouseUp(smooth_x, smooth_y, button="left")
        st.is_dragging = False
    st.pinch_was_held = False
    st.click_fired = False
    st.scroll_prev_y = None
    st.scroll_prev_y = None


def _handle_scroll(smooth_x: float, smooth_y: float, gesture_data: dict) -> None:
    scroll_y = gesture_data.get("scroll_y", gesture_data["point"][1])
    if st.scroll_prev_y is not None:
        delta = (st.scroll_prev_y - scroll_y) * SCROLL_SENSITIVITY * 120
        if abs(delta) > 2:
            pyautogui.scroll(int(delta))
            st.state.scroll_delta = delta
    st.scroll_prev_y = scroll_y
    st.pinch_was_held = False
    st.click_fired = False
    st.state.gesture = "scroll"


# ── Public API ────────────────────────────────────────────────────────────────
def apply_gesture(gesture_data: dict) -> None:
    """
    Translate a gesture dict (from gesture_detector) into OS cursor actions.
    Updates shared state and calls the appropriate pyautogui function.
    """
    gesture = gesture_data["gesture"]
    point   = gesture_data["point"]

    raw_x, raw_y       = _remap_to_screen(point)
    smooth_x, smooth_y = _smooth_cursor(raw_x, raw_y)

    st.state.cursor_x          = smooth_x
    st.state.cursor_y          = smooth_y
    st.state.last_gesture_time = time.time()

    _HANDLERS = {
        "drag":        _handle_drag,
        "drop":        _handle_drop,
        "left_click":  _handle_left_click,
        "right_click": _handle_right_click,
        "double_click": _handle_double_click,
        "move":        _handle_move,
        "open":        _handle_open,
        "scroll":      _handle_scroll,
    }

    handler = _HANDLERS.get(gesture)
    if handler:
        if gesture == "scroll":
            handler(smooth_x, smooth_y, gesture_data)
        else:
            handler(smooth_x, smooth_y)

    st.prev_gesture = gesture