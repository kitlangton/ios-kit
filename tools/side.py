# reference | kit | 50% overlay, scaled to 1x for viewing.
import sys
from PIL import Image, ImageChops, ImageDraw
ref, kit, out = sys.argv[1:4]
a = Image.open(ref).convert("RGB")
b = Image.open(kit).convert("RGB").resize(a.size)
blend = Image.blend(a, b, 0.5)
diff = ImageChops.difference(a, b).convert("L")
score = sum(diff.get_flattened_data()) / (a.size[0] * a.size[1] * 255)
w, h = a.size
canvas = Image.new("RGB", (w * 3 + 40, h), (128, 128, 128))
for i, im in enumerate([a, b, blend]):
    canvas.paste(im, (i * (w + 20), 0))
canvas = canvas.resize((canvas.width // 2, canvas.height // 2), Image.LANCZOS)
canvas.save(out)
print(f"mean diff {score:.4f}")
