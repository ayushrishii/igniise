#!/usr/bin/env python3
"""Regenerate the binary assets for igniise terminal (public/manifesto-texture.png, public/og-image.png).

These assets are procedurally generated and intentionally not stored in git
(binary push constraints + repo size). Run: python3 scripts/generate_assets.py
Requires: Pillow, numpy (pip install pillow numpy).
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
os.makedirs(OUT, exist_ok=True)

BG = (14, 13, 11)        # #0E0D0B warm off-black
BONE = (237, 234, 227)   # #EDEAE3
ACCENT = (201, 150, 63)  # #C9963F bronze-amber
MUTED = (97, 92, 82)     # #615C52

rng = np.random.default_rng(7)

def grain(img, strength=6):
    arr = np.asarray(img).astype(np.int16)
    noise = rng.normal(0, strength, arr.shape[:2])[..., None]
    return Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))

def manifesto_texture():
    """Engraved intaglio arcs in faint warm bronze dissolving into near-black."""
    w, h = 2400, 1350
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    cx, cy = int(w * 0.78), int(h * 1.15)
    for i, r in enumerate(range(160, 2400, 46)):
        fade = max(0.04, 0.22 - i * 0.004)
        col = tuple(int(BG[c] + (ACCENT[c] - BG[c]) * fade) for c in range(3))
        d.arc([cx - r, cy - r, cx + r, cy + r], start=180, end=330, fill=col, width=2)
    for _ in range(60):  # sparse vertical engraving ticks
        x = int(rng.integers(0, w)); y0 = int(rng.integers(0, h))
        col = tuple(int(BG[c] + (ACCENT[c] - BG[c]) * rng.uniform(0.03, 0.1)) for c in range(3))
        d.line([x, y0, x, y0 + int(rng.integers(20, 120))], fill=col, width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    grain(img, 5).save(os.path.join(OUT, "manifesto-texture.png"), optimize=True)

def og_image():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    try:
        serif = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf", 120)
        mono = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf", 28)
    except OSError:
        serif = ImageFont.load_default(); mono = ImageFont.load_default()
    d.line([80, h - 330, 380, h - 330], fill=ACCENT, width=3)
    d.text((76, h - 300), "igniise", font=serif, fill=BONE)
    d.text((80, h - 130), "Two markets. Same event. Different truths.", font=mono, fill=MUTED)
    grain(img, 4).save(os.path.join(OUT, "og-image.png"), optimize=True)

if __name__ == "__main__":
    manifesto_texture(); og_image()
    print("assets written to public/")
