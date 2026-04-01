"""
Gesture Engine — entry point
────────────────────────────
Starts three concurrent workers:

  1. activity_thread  — daemon thread that flips active/inactive on timeout
  2. ws_thread        — daemon thread running the asyncio WebSocket server
  3. main thread      — OpenCV capture loop (must own the GUI thread on Windows)

Run with:
    python main.py
Press 'q' in the Gesture Engine window to quit.
"""

import asyncio
import threading
import time

from camera import check_activity, run_capture
from websocket_server import ws_server


def main() -> None:
    loop = asyncio.new_event_loop()

    # 1. Activity monitor
    activity_thread = threading.Thread(target=check_activity, daemon=True)
    activity_thread.start()

    # 2. WebSocket server (runs inside *loop* on its own thread)
    ws_thread = threading.Thread(
        target=lambda: loop.run_until_complete(ws_server()),
        daemon=True,
    )
    ws_thread.start()

    # Give the WS server a moment to bind before the capture loop starts
    time.sleep(0.5)

    # 3. Init audio device and OpenCV capture loop — blocks until the user presses 'q'
    from camera import init_audio_device
    init_audio_device()
    run_capture(loop)


if __name__ == "__main__":
    main()
