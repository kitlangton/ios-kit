# Ink rows (top–bottom in pt) of a reference vs a kit render, to calibrate vertical metrics.
# usage: python3 rows.py ref.png kit.png [x0 x1]
import sys
from PIL import Image
import numpy as np

def rows(path, x0, x1):
    a = np.asarray(Image.open(path).convert("L")).astype(int)
    bg = np.median(a[:, int(x0 * 3):int(x1 * 3)], axis=1, keepdims=True)
    ink = (np.abs(a[:, int(x0 * 3):int(x1 * 3)] - bg) > 60).any(axis=1)
    out, start = [], None
    for y, v in enumerate(ink):
        if v and start is None: start = y
        if not v and start is not None:
            out.append((start / 3, y / 3)); start = None
    return out

x0, x1 = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else (14, 430)
r, k = rows(sys.argv[1], x0, x1), rows(sys.argv[2], x0, x1)
for i in range(max(len(r), len(k))):
    a = r[i] if i < len(r) else None
    b = k[i] if i < len(k) else None
    fmt = lambda t: f"{t[0]:7.2f}-{t[1]:7.2f}" if t else " " * 15
    d = f"{b[0] - a[0]:+6.2f}" if a and b else ""
    print(f"{i:3d}  ref {fmt(a)}   kit {fmt(b)}   {d}")
