#!/usr/bin/env python3
"""Cut out the raw lesson illustrations and export them as transparent WebP.

Needs rembg[cpu] and pillow (run it with the venv that has them, using -I).
For each asset: get a matte from the rembg model, optionally repair it, rebuild
the edge colours (removes the white fringe), drop faint specks, trim the fully
transparent border, add about 4% transparent padding, fit the longest side to
768 px, save public/img/<name>.webp, then refresh public/img/manifest.json.

Matte repairs (the renders sit on a flat white background):
  --key NAME ...   add back coloured parts the model dropped (floating
                   question marks, confetti, a bench, a water patch) using a
                   colour key against the background colour. NAME:CORE:LO
                   sets the thresholds (default 40:10); raise both to keep a
                   soft glow out of the matte, e.g. think:90:60.
  --fill NAME ...  make enclosed holes solid (mirror glass, lens, screen).
  --matting NAME   refine the model matte with alpha matting.
Each processed asset prints "lost=N": coloured pixels that ended up
transparent. A large number means parts were dropped, so try --key.

Usage examples (run from the project root):
  VENV/bin/python -I tools/images/cutout.py --src RAW_DIR --all --sheet-dir SHEETS
  VENV/bin/python -I tools/images/cutout.py --src RAW_DIR --key trophy boat -- trophy boat
  VENV/bin/python -I tools/images/cutout.py --src RAW_DIR --pick boat=boat-2.jpg boat
  VENV/bin/python -I tools/images/cutout.py --sheet-only --sheet-dir SHEETS --zoom bell

The raw file for a name is RAW_DIR/<name>-<k>.<ext> with the highest k, unless
--pick name=file says otherwise. Set --models-dir (or U2NET_HOME) to choose
where rembg keeps its downloaded models.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MAX_SIDE = 768
PAD_FRAC = 0.04
WEBP_QUALITY = 88
KEY_LO = 10.0    # colour distance from the background below this is background
KEY_CORE = 40.0  # colour distance above this is solid foreground

# Asset order and alt text for the manifest (plain words, no dashes).
ALT: dict[str, str] = {
    "remember": "Glowing yellow lightbulb",
    "ready-kit": "Tablet with a graph, notebook, pencil, ruler and calculator",
    "warmup": "Puzzled student scratching his head among question marks",
    "vocab": "Stack of three textbooks with a pencil on top",
    "inquiry": "Magnifying glass over a grid with a line",
    "think": "Student thinking with a lightbulb above his head",
    "teamwork": "Two students working together on one tablet",
    "watchout": "Caution sign with an exclamation mark on a traffic cone",
    "translation": "Red skateboard gliding to the right",
    "dilation": "Coil spring being stretched outward",
    "reflection": "Paper airplane and its image in a mirror",
    "tickets": "Two event tickets next to a baseball",
    "paint": "Blue and yellow paint cans with a brush",
    "bowling": "Blue bowling ball rolling toward three pins",
    "savings": "Pink piggy bank with stacked gold coins",
    "boat": "Pedal boat on calm water",
    "phone-game": "Smartphone showing a game controller, with game pieces",
    "headphones": "Headphones with a music note",
    "bell": "Golden school bell ringing",
    "exit": "Open door with a green arrow pointing out",
    "reflect": "Student calmly writing in a notebook",
    "trophy": "Golden trophy with confetti and stars",
    "stopwatch": "Red and silver stopwatch",
    "explore": "Tablet showing three parallel lines on a grid",
}


def find_raw(src: Path, name: str, picks: dict[str, str]) -> Path:
    if name in picks:
        path = src / picks[name]
        if not path.exists():
            sys.exit(f"{name}: picked file {path} not found")
        return path
    best, best_k = None, 0
    for p in src.glob(f"{name}-*.*"):
        m = re.fullmatch(rf"{re.escape(name)}-(\d+)\.(png|jpg|jpeg|webp)", p.name)
        if m and int(m.group(1)) > best_k:
            best, best_k = p, int(m.group(1))
    if best is None:
        sys.exit(f"{name}: no raw image in {src}")
    return best


def background_distance(rgb):
    """Per pixel distance (max over channels) from the median border colour."""
    import numpy as np

    b = 6
    border = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
                             rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    return np.abs(rgb - bg).max(axis=2)


def key_alpha(dist, core: float = KEY_CORE, lo: float = KEY_LO):
    """Colour key matte: solid inside clearly coloured shapes, soft at their rim."""
    import numpy as np
    from scipy import ndimage

    solid = ndimage.binary_opening(dist > core, iterations=1)
    solid = ndimage.binary_erosion(solid, iterations=1)
    rim = ndimage.binary_dilation(solid, iterations=3) & ~solid
    local = ndimage.grey_dilation(dist, size=(7, 7))
    soft = np.clip((dist - lo) / np.maximum(local - lo, 1.0), 0.0, 1.0)
    alpha = np.zeros(dist.shape, dtype=np.float64)
    alpha[solid] = 1.0
    alpha[rim] = soft[rim]
    return alpha


def clean_alpha(alpha, min_alpha: float = 4 / 255, speck_frac: float = 0.0004):
    """Zero near invisible alpha and drop tiny faint islands left by the matte."""
    import numpy as np
    from scipy import ndimage

    alpha = np.where(alpha < min_alpha, 0.0, alpha)
    labels, count = ndimage.label(alpha > 0)
    if count > 1:
        idx = np.arange(1, count + 1)
        sizes = ndimage.sum(np.ones_like(alpha), labels, idx)
        peaks = ndimage.maximum(alpha, labels, idx)
        drop = np.zeros(count + 1, dtype=bool)
        drop[1:] = (sizes < speck_frac * alpha.size) & (peaks < 0.63)
        alpha = np.where(drop[labels], 0.0, alpha)
    return alpha


def lost_pixels(dist, alpha, core: float = KEY_CORE) -> int:
    """Clearly coloured pixels (not thin lines or noise) that are now transparent."""
    from scipy import ndimage

    lost = (dist > core) & (alpha < 0.5)
    return int(ndimage.binary_opening(lost, iterations=2).sum())


def finish(rgba):
    """Trim the transparent border, pad about 4%, fit the longest side."""
    from PIL import Image

    box = rgba.getchannel("A").getbbox()
    if box is None:
        raise ValueError("cutout is empty")
    rgba = rgba.crop(box)
    w, h = rgba.size
    pad = max(1, round(PAD_FRAC * max(w, h)))
    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(rgba, (pad, pad))
    w, h = canvas.size
    if max(w, h) > MAX_SIDE:
        scale = MAX_SIDE / max(w, h)
        canvas = canvas.resize((max(1, round(w * scale)), max(1, round(h * scale))),
                               Image.Resampling.LANCZOS)
    return canvas


def cut_one(raw: Path, session, matting: bool, key: tuple[float, float] | None,
            fill: bool, decontaminate: bool):
    import numpy as np
    from PIL import Image
    from pymatting import estimate_foreground_ml
    from rembg import remove
    from rembg.bg import alpha_matting_cutout
    from scipy import ndimage

    img = Image.open(raw).convert("RGB")
    rgb = np.asarray(img).astype(np.float64)
    mask = remove(img, session=session, only_mask=True)
    if matting:
        cut = alpha_matting_cutout(img, mask, 240, 12, 8)
        alpha = np.asarray(cut.getchannel("A")).astype(np.float64) / 255
    else:
        alpha = np.asarray(mask.convert("L")).astype(np.float64) / 255
    dist = background_distance(rgb)
    if key:
        alpha = np.maximum(alpha, key_alpha(dist, *key))
    if fill:
        alpha = np.where(ndimage.binary_fill_holes(alpha > 0.5), 1.0, alpha)
    alpha = clean_alpha(alpha)
    lost = lost_pixels(dist, alpha, key[0] if key else KEY_CORE)
    if decontaminate:
        fg = estimate_foreground_ml(rgb / 255, alpha)
    else:
        fg = rgb / 255
    rgba = np.dstack([np.clip(fg, 0, 1), alpha])
    rgba = (rgba * 255 + 0.5).astype(np.uint8)
    rgba[rgba[..., 3] == 0, :3] = 0
    return finish(Image.fromarray(rgba, "RGBA")), lost


def write_manifest(dst: Path, manifest_path: Path) -> dict:
    from PIL import Image

    data: dict = {}
    if manifest_path.exists():
        try:
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = {}
    ordered: dict = {}
    for name in list(ALT) + [n for n in data if n not in ALT]:
        file = dst / f"{name}.webp"
        if not file.exists():
            continue
        with Image.open(file) as im:
            w, h = im.size
        ordered[name] = {"file": f"/img/{name}.webp", "width": w, "height": h,
                         "alt": ALT.get(name) or data.get(name, {}).get("alt", name)}
    manifest_path.write_text(json.dumps(ordered, indent=2) + "\n", encoding="utf-8")
    return ordered


def checker(size: tuple[int, int], cell: int = 16):
    from PIL import Image, ImageDraw

    img = Image.new("RGBA", size, (40, 42, 48, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(62, 65, 72, 255))
    return img


def contact_sheets(dst: Path, names: list[str], out_dir: Path, cols: int = 6,
                   tile: int = 256) -> list[Path]:
    from PIL import Image, ImageDraw, ImageFont

    out_dir.mkdir(parents=True, exist_ok=True)
    label_h = 26
    rows = math.ceil(len(names) / cols)
    size = (cols * tile, rows * (tile + label_h))
    font = ImageFont.load_default(size=16)
    paths = []
    for mode in ("dark", "white"):
        sheet = checker(size) if mode == "dark" else Image.new("RGBA", size, (255, 255, 255, 255))
        draw = ImageDraw.Draw(sheet)
        ink = (235, 235, 235, 255) if mode == "dark" else (60, 60, 60, 255)
        for i, name in enumerate(names):
            x0, y0 = (i % cols) * tile, (i // cols) * (tile + label_h)
            with Image.open(dst / f"{name}.webp") as im:
                im = im.convert("RGBA")
                im.thumbnail((tile - 12, tile - 12), Image.Resampling.LANCZOS)
            sheet.alpha_composite(im, (x0 + (tile - im.width) // 2, y0 + (tile - im.height) // 2))
            tw = draw.textlength(name, font=font)
            draw.text((x0 + (tile - tw) / 2, y0 + tile + 3), name, fill=ink, font=font)
        path = out_dir / f"contact-{mode}.png"
        sheet.convert("RGB").save(path)
        paths.append(path)
    return paths


def zoom_sheet(dst: Path, name: str, out_dir: Path) -> Path:
    """One asset at export size on dark checker and on white, side by side."""
    from PIL import Image

    with Image.open(dst / f"{name}.webp") as im:
        im = im.convert("RGBA")
    w, h = im.size
    canvas = Image.new("RGBA", (2 * w + 24, h + 16), (128, 128, 128, 255))
    dark = checker((w, h))
    dark.alpha_composite(im)
    white = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    white.alpha_composite(im)
    canvas.paste(dark, (8, 8))
    canvas.paste(white, (w + 16, 8))
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"zoom-{name}.png"
    canvas.convert("RGB").save(path)
    return path


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*", help="asset names to process")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--src", type=Path, help="folder with raw renders")
    ap.add_argument("--dst", type=Path, default=PROJECT_ROOT / "public/img")
    ap.add_argument("--manifest", type=Path, help="default: DST/manifest.json")
    ap.add_argument("--model", default="birefnet-general")
    ap.add_argument("--fallback-model", default="isnet-general-use")
    ap.add_argument("--models-dir", type=Path, help="where rembg stores models (U2NET_HOME)")
    ap.add_argument("--matting", nargs="*", default=[], metavar="NAME",
                    help="refine these mattes with alpha matting")
    ap.add_argument("--key", nargs="*", default=[], metavar="NAME[:CORE[:LO]]",
                    help="add back coloured parts the model dropped")
    ap.add_argument("--fill", nargs="*", default=[], metavar="NAME",
                    help="make enclosed holes solid")
    ap.add_argument("--no-decontaminate", action="store_true")
    ap.add_argument("--pick", action="append", default=[], metavar="NAME=FILE")
    ap.add_argument("--sheet-dir", type=Path, help="write contact sheets here")
    ap.add_argument("--zoom", nargs="*", default=[], metavar="NAME",
                    help="also write a full size dark/white preview for these")
    ap.add_argument("--sheet-only", action="store_true", help="skip cutting, only sheets")
    args = ap.parse_args()

    if args.models_dir:
        os.environ["U2NET_HOME"] = str(args.models_dir)
    names = list(ALT) if args.all else args.names
    keys: dict[str, tuple[float, float]] = {}
    for spec in args.key:
        name, *vals = spec.split(":")
        core = float(vals[0]) if vals else KEY_CORE
        lo = float(vals[1]) if len(vals) > 1 else KEY_LO
        keys[name] = (core, lo)
    unknown = [n for n in names + list(keys) + args.fill + args.matting if n not in ALT]
    if unknown:
        sys.exit(f"unknown asset names: {unknown}")
    picks = dict(p.split("=", 1) for p in args.pick)
    args.dst.mkdir(parents=True, exist_ok=True)
    manifest_path = args.manifest or args.dst / "manifest.json"

    if not args.sheet_only and names:
        if args.src is None:
            sys.exit("--src is required")
        from rembg import new_session

        try:
            session = new_session(args.model)
            used = args.model
        except Exception as err:  # noqa: BLE001
            print(f"{args.model} failed to load ({err}), using {args.fallback_model}")
            session = new_session(args.fallback_model)
            used = args.fallback_model
        for name in names:
            raw = find_raw(args.src, name, picks)
            t0 = time.time()
            img, lost = cut_one(raw, session, name in args.matting, keys.get(name),
                                name in args.fill, not args.no_decontaminate)
            out = args.dst / f"{name}.webp"
            img.save(out, "WEBP", quality=WEBP_QUALITY, alpha_quality=100, method=6)
            fixes = [f for f, on in (("matting", name in args.matting),
                                     ("key", name in keys),
                                     ("fill", name in args.fill)) if on]
            print(f"{name}: {raw.name} -> {out.name} {img.size[0]}x{img.size[1]} "
                  f"lost={lost} ({used}{', ' + '+'.join(fixes) if fixes else ''}, "
                  f"{time.time() - t0:.1f}s)", flush=True)

    manifest = write_manifest(args.dst, manifest_path)
    print(f"manifest: {len(manifest)} entries -> {manifest_path}")
    if args.sheet_dir:
        done = [n for n in ALT if (args.dst / f"{n}.webp").exists()]
        for path in contact_sheets(args.dst, done, args.sheet_dir):
            print(f"sheet: {path}")
        for name in args.zoom:
            print(f"zoom: {zoom_sheet(args.dst, name, args.sheet_dir)}")


if __name__ == "__main__":
    main()
