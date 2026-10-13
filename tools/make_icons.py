# Generates the PNG icons from the brand mark (a square with two filled quadrants). Needs Pillow.
import pathlib
from PIL import Image, ImageDraw
INK, PAPER = (29, 29, 32, 255), (247, 247, 245, 255)
OUT = pathlib.Path(__file__).parent.parent / 'src' / 'pwa' / 'icons'

def mark(d, c, s):
    x0 = c - s / 2; h = s / 2
    d.rounded_rectangle((x0, x0, x0 + s, x0 + s), radius=s * .12, outline=PAPER, width=int(s * .11))
    d.rectangle((x0, x0, x0 + h, x0 + h), fill=PAPER); d.rectangle((x0 + h, x0 + h, x0 + s, x0 + s), fill=PAPER)

def icon(size, kind):
    S = size * 4
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0) if kind == 'any' else INK); d = ImageDraw.Draw(im)
    if kind == 'any': d.rounded_rectangle((0, 0, S - 1, S - 1), radius=S * .22, fill=INK)
    mark(d, S / 2, S * (.42 if kind == 'maskable' else .47))   # maskable keeps the art inside the 80% safe circle
    im = im.resize((size, size), Image.LANCZOS)
    return im.convert('RGB') if kind == 'apple' else im

icon(192, 'any').save(OUT / 'icon-192.png'); icon(512, 'any').save(OUT / 'icon-512.png')
icon(512, 'maskable').save(OUT / 'maskable-512.png'); icon(180, 'apple').save(OUT / 'apple-touch-icon.png')
print('icons written to', OUT)
