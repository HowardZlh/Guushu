#!/usr/bin/env python3
"""
Generate the self-hosted images under assets/img/ from scripts/image-sources.json.

Why this exists: og:image / twitter:image used to hotlink images.unsplash.com,
so every social card depended on a third party being up. Now the build only
ships files that live in this repo. This script is the one place that still
talks to Unsplash, and it is run by hand (never in CI).

Usage:
    python3 scripts/make_images.py            # (re)generate everything that is missing
    python3 scripts/make_images.py --force    # regenerate all files
    python3 scripts/make_images.py --only boho-chic-revival --only brand-story

Requires Pillow (not in requirements.txt on purpose; the build itself does not
need it):  python3 -m pip install Pillow

Output layout (all JPEG, quality 82, progressive):
    assets/img/posts/<slug>.jpg     1200x630 centre crop  (og:image size; also
                                    used for the card and the in-body image)
    assets/img/pages/<name>.jpg     resized to `width`, aspect ratio kept
    assets/img/og-default.jpg       1200x630 centre crop, used by non-post pages
"""

import argparse
import io
import json
import os
import sys
import urllib.request

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover - dev-only dependency
    sys.exit("Pillow is required: python3 -m pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "scripts", "image-sources.json")
IMG_DIR = os.path.join(ROOT, "assets", "img")

OG_SIZE = (1200, 630)
JPEG_OPTS = {"format": "JPEG", "quality": 82, "optimize": True, "progressive": True}
SOURCE_URL = "https://images.unsplash.com/{photo}?w=1600&q=85&fm=jpg&fit=max"


def fetch(photo):
    url = SOURCE_URL.format(photo=photo)
    req = urllib.request.Request(url, headers={"User-Agent": "guushu-make-images/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")


def save(img, rel_path):
    out = os.path.join(IMG_DIR, rel_path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, **JPEG_OPTS)
    return out


def og_crop(img):
    return ImageOps.fit(img, OG_SIZE, method=Image.LANCZOS, centering=(0.5, 0.5))


def resize_width(img, width):
    if img.width <= width:
        return img
    h = round(img.height * width / img.width)
    return img.resize((width, h), Image.LANCZOS)


def plan(manifest):
    """Yield (name, rel_path, photo, transform) for every image in the manifest."""
    for slug, photo in manifest["posts"].items():
        yield slug, f"posts/{slug}.jpg", photo, og_crop
    for name, spec in manifest["pages"].items():
        width = int(spec.get("width", 1000))
        yield name, f"pages/{name}.jpg", spec["photo"], lambda im, w=width: resize_width(im, w)
    yield "og-default", "og-default.jpg", manifest["og_default"]["photo"], og_crop


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", action="append", default=[], metavar="NAME",
                    help="post slug / page name / 'og-default'; repeatable")
    ap.add_argument("--force", action="store_true", help="overwrite existing files")
    args = ap.parse_args()

    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)

    cache = {}
    done = skipped = 0
    for name, rel_path, photo, transform in plan(manifest):
        if args.only and name not in args.only:
            continue
        out = os.path.join(IMG_DIR, rel_path)
        if os.path.exists(out) and not args.force:
            skipped += 1
            continue
        if not photo.startswith("photo-"):
            # e.g. "commons:<File>.jpg" -- produced by hand, only recorded here
            print(f"skip {name}: source {photo!r} is not an Unsplash photo id; "
                  f"create {rel_path} manually")
            skipped += 1
            continue
        if photo not in cache:
            print(f"fetch {photo}")
            cache[photo] = fetch(photo)
        path = save(transform(cache[photo]), rel_path)
        print(f"  -> {os.path.relpath(path, ROOT)} ({os.path.getsize(path) // 1024} KB)")
        done += 1
    print(f"done: {done} written, {skipped} already present")
    if args.only:
        missing = set(args.only) - {n for n, *_ in plan(manifest)}
        if missing:
            sys.exit(f"unknown --only name(s): {', '.join(sorted(missing))}")


if __name__ == "__main__":
    main()
