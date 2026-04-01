from gesture_detector import detect_gesture
from cursor_controller import apply_gesture

last_set1_gesture = "none"

def process_set1(right_hand_landmarks) -> str:
    """
    Process cursor controls (Set 1).
    Returns active gesture string.
    """
    global last_set1_gesture
    if right_hand_landmarks:
        gesture_info = detect_gesture(right_hand_landmarks)
        apply_gesture(gesture_info)
        gesture = gesture_info["gesture"]
        
        if gesture != last_set1_gesture and gesture != "open":
            print(f"[Set 1] Executed gesture: {gesture}")
            last_set1_gesture = gesture
        elif gesture == "open":
            last_set1_gesture = "open"
            
        return gesture
    return "none"
