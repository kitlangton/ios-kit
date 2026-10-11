# Stack the same crop (pt coords) of reference and kit: python3 crop.py name x0 y0 x1 y1 [zoom]
import sys
from PIL import Image
n, x0, y0, x1, y1 = sys.argv[1], *map(float, sys.argv[2:6])
z = float(sys.argv[6]) if len(sys.argv) > 6 else 1
box = tuple(int(v * 3) for v in (x0, y0, x1, y1))
a = Image.open(f"reference/{n}.png").convert("RGB").crop(box)
b = Image.open(f"compare/{n}.kit.png").convert("RGB").crop(box)
w, h = a.size
c = Image.new("RGB", (w, h * 2 + 6), (255, 0, 255))
c.paste(a, (0, 0)); c.paste(b, (0, h + 6))
if z != 1: c = c.resize((int(c.width * z), int(c.height * z)), Image.LANCZOS)
c.save(f"compare/{n}.crop.png")
