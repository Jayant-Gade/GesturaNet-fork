import cv2


# Hand skeleton connections (MediaPipe landmark indices)
_CONNECTIONS = [
    (0, 1),  (1, 2),  (2, 3),  (3, 4),   # thumb
    (0, 5),  (5, 6),  (6, 7),  (7, 8),   # index
    (0, 9),  (9, 10), (10, 11),(11, 12),  # middle
    (0, 13),(13, 14),(14, 15),(15, 16),   # ring
    (0, 17),(17, 18),(18, 19),(19, 20),   # pinky
    (5, 9),  (9, 13),(13, 17),            # palm
]


def draw_landmarks_on_frame(frame, hand_landmarks_list) -> None:
    """Draw hand skeleton on *frame* in-place for every detected hand."""
    h, w = frame.shape[:2]
    for hand_landmarks in hand_landmarks_list:
        pts = [
            (int(lm.x * w), int(lm.y * h))
            for lm in hand_landmarks
        ]
        for a, b in _CONNECTIONS:
            cv2.line(frame, pts[a], pts[b], (0, 200, 100), 1)
        for pt in pts:
            cv2.circle(frame, pt, 3, (0, 255, 150), -1)
