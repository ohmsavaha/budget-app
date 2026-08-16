#!/usr/bin/env python3
"""Normalize pet artwork and build lightweight breathing-loop derivatives."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


CANVAS = 1024
DISPLAY = 512
THUMB = 128
FRAME_DURATIONS = [150, 170, 210, 300, 210, 170]
FRAME_SCALES = [0.985, 0.993, 1.0, 1.012, 1.0, 0.993]
FRAME_Y = [4, 2, 0, -3, 0, 2]


def _extract_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = np.asarray(rgba.getchannel("A"))
    if alpha.min() < 250:
        return rgba

    rgb = np.asarray(image.convert("RGB"))
    channel_min = rgb.min(axis=2)
    channel_max = rgb.max(axis=2)
    seed = (channel_min < 238) | ((channel_max - channel_min) > 8)
    seed = ndimage.binary_closing(seed, np.ones((5, 5)))
    seed = ndimage.binary_opening(seed, np.ones((2, 2)))

    labels, count = ndimage.label(seed)
    if count:
        sizes = ndimage.sum(seed, labels, range(1, count + 1))
        candidates = np.argsort(sizes)[::-1]
        keep = np.zeros_like(seed)
        kept = 0
        for candidate in candidates:
            area = sizes[candidate]
            if area < max(2200, seed.size * 0.0014):
                break
            component = labels == candidate + 1
            ys, xs = np.where(component)
            if not len(xs):
                continue
            center_distance = abs(xs.mean() - seed.shape[1] / 2) + abs(ys.mean() - seed.shape[0] / 2)
            if kept == 0 or center_distance < seed.shape[0] * 0.72:
                keep |= component
                kept += 1
            if kept >= 5:
                break
        seed = keep

    seed = ndimage.binary_closing(seed, np.ones((7, 7)))
    seed = ndimage.binary_fill_holes(seed)
    seed = ndimage.binary_dilation(seed, iterations=1)
    inside = ndimage.distance_transform_edt(seed)
    outside = ndimage.distance_transform_edt(~seed)
    feather = np.clip((inside - outside + 2.0) / 4.0, 0.0, 1.0)
    rgba.putalpha(Image.fromarray(np.uint8(feather * 255), "L"))
    return rgba


def _normalize(image: Image.Image) -> Image.Image:
    rgba = _extract_alpha(image)
    bbox = rgba.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("No foreground was detected")
    subject = rgba.crop(bbox)
    max_side = 890
    ratio = min(max_side / subject.width, max_side / subject.height)
    size = (max(1, round(subject.width * ratio)), max(1, round(subject.height * ratio)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS))
    x = (CANVAS - subject.width) // 2
    y = (CANVAS - subject.height) // 2 + 18
    canvas.alpha_composite(subject, (x, y))
    return canvas


def _frame(source: Image.Image, scale: float, y_offset: int) -> Image.Image:
    frame = source.resize((DISPLAY, DISPLAY), Image.Resampling.LANCZOS)
    width = round(DISPLAY * scale)
    height = round(DISPLAY * scale)
    posed = frame.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (DISPLAY, DISPLAY))
    canvas.alpha_composite(posed, ((DISPLAY - width) // 2, (DISPLAY - height) // 2 + y_offset))
    return canvas


def build(input_path: Path, source_path: Path, static_path: Path, webp_path: Path) -> None:
    normalized = _normalize(Image.open(input_path))
    source_path.parent.mkdir(parents=True, exist_ok=True)
    static_path.parent.mkdir(parents=True, exist_ok=True)
    webp_path.parent.mkdir(parents=True, exist_ok=True)

    source_tmp = source_path.with_name(f".{source_path.name}.tmp")
    static_tmp = static_path.with_name(f".{static_path.name}.tmp")
    webp_tmp = webp_path.with_name(f".{webp_path.name}.tmp")
    source_image = normalized.quantize(
        colors=256,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.FLOYDSTEINBERG,
    )
    source_image.save(source_tmp, format="PNG", optimize=True)
    normalized.resize((THUMB, THUMB), Image.Resampling.LANCZOS).save(
        static_tmp, format="PNG", optimize=True
    )
    frames = [_frame(normalized, scale, y) for scale, y in zip(FRAME_SCALES, FRAME_Y)]
    frames[0].save(
        webp_tmp,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATIONS,
        loop=0,
        lossless=False,
        quality=92,
        method=6,
    )
    source_tmp.replace(source_path)
    static_tmp.replace(static_path)
    webp_tmp.replace(webp_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("source", type=Path)
    parser.add_argument("static", type=Path)
    parser.add_argument("webp", type=Path)
    args = parser.parse_args()
    build(args.input, args.source, args.static, args.webp)


if __name__ == "__main__":
    main()
