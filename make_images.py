#!/usr/bin/env python3
# pip install pillow
from PIL import Image, ImageDraw, ImageFont
import os, textwrap

os.makedirs('post/2025-05-21-spring-pleats', exist_ok=True)
W, H = 1200, 1600          # 封面
WW, HH = 800, 1200         # lookbook
colors = ['#b3d9e3', '#e3d9b3', '#d9e3b3', '#c8e3d9', '#e3c8d9']
font = ImageFont.load_default()

def make(fn, txt, size, color):
    img = Image.new('RGB', size, color)
    draw = ImageDraw.Draw(img)
    lines = textwrap.wrap(txt, width=18)
    # 计算整体高度
    total_h = 0
    for line in lines:
        _, _, w, h = draw.textbbox((0, 0), line, font=font)
        total_h += h
    y = (size[1] - total_h) // 2
    for line in lines:
        _, _, w, h = draw.textbbox((0, 0), line, font=font)
        draw.text(((size[0] - w) // 2, y), line, fill='white', font=font)
        y += h
    img.save(fn)
    print('saved', fn)

# 封面
make('post/2025-05-21-spring-pleats/hero.jpg',
     'Spring Pleats 2025\n竹影新褶', (W, H), colors[0])

# lookbook 5 张
for i, c in enumerate(colors, 1):
    make(f'post/2025-05-21-spring-pleats/{i:02d}.jpg',
         f'Look {i}', (WW, HH), c)