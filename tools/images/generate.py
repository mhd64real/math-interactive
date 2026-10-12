#!/usr/bin/env python3
"""Generate the lesson illustration set with the Gemini image API.

Standard library only. The API key is read from the project's .env file
(GEMINI_API_KEY=...) or from the environment, and is never printed or logged.

Usage examples (run from the project root):
  python3 -I tools/images/generate.py --list-models
  python3 -I tools/images/generate.py --out RAW_DIR remember
  python3 -I tools/images/generate.py --out RAW_DIR --ref RAW_DIR/remember-1.png --all
  python3 -I tools/images/generate.py --out RAW_DIR --ref REF.png --note "make the cone smaller" watchout

Every attempt is saved as RAW_DIR/<name>-<k>.<ext> (k = 1, 2, 3 ...), so earlier
attempts are kept for comparison. Every API call is appended to
RAW_DIR/calls.jsonl, and --budget caps the total calls recorded there.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"
API_BASE = "https://generativelanguage.googleapis.com/v1beta"
PRIMARY_MODEL = "gemini-3-pro-image"
FALLBACK_MODEL = "gemini-3.1-flash-image"

STYLE = (
    "3D clay-style illustration, soft rounded shapes, smooth matte clay material "
    "with a subtle soft gloss, soft studio lighting from the top left, gentle "
    "ambient occlusion, friendly and clean, vibrant but soft palette (coral red, "
    "sunflower yellow, mint green, sky blue, warm orange, navy), high detail, a "
    "single centered subject, isolated on a pure flat white background, no cast "
    "shadow on the ground, no text, no letters, no numbers, no logos, no "
    "watermark, no border."
)

REF_PREFIX = (
    "Match the rendering style of the reference image exactly (same clay "
    "material, lighting, palette and level of detail), but draw a completely "
    "different subject: "
)

# Added to every prompt that contains a person.
PERSON_RULE = (
    "Every person in the image is a teenage boy (male). Each figure has a blank "
    "featureless face with no eyes, no nose and no mouth, with short dark hair: "
    "the front of the head is a smooth, empty skin-toned clay surface with no "
    "facial features at all, no eyebrows, no glasses. The face is perfectly "
    "flat and even like the surface of an egg: no nose bump, no nose ridge, no "
    "bulges or dents that hint at any feature. Fully clothed, school "
    "appropriate."
)

# Added to every prompt without a person, so objects do not get cartoon faces.
OBJECT_RULE = (
    "No people, no characters, no hands, and no cartoon faces or eyes on the "
    "objects."
)

NO_TEXT_RULE = (
    "Any screen, page, label, dial or button must be completely blank or show "
    "only simple shapes: absolutely no readable text, letters or digits anywhere."
)

# name: (subject, has_person)
ASSETS: dict[str, tuple[str, bool]] = {
    "remember": ("a glowing yellow lightbulb with soft light rays", False),
    "ready-kit": (
        "a neat flat-lay arrangement, seen from above at a slight angle, of a "
        "tablet showing a simple square grid with two diagonal lines (no "
        "numbers), a spiral graph-paper notebook, a yellow pencil, a clear "
        "ruler with plain tick marks only, and a scientific calculator with "
        "unlabeled blank buttons and a blank screen",
        False,
    ),
    "warmup": (
        "a teenage boy student, blank featureless face with no eyes, no nose "
        "and no mouth, with short dark hair, scratching his head with one hand, "
        "three floating question marks around him, wearing a navy blue school "
        "polo shirt and grey trousers and simple sneakers, full body, standing",
        True,
    ),
    "vocab": (
        "a stack of three closed textbooks (blue, red, green) with plain covers "
        "and no titles, and a yellow pencil lying diagonally on top",
        False,
    ),
    "inquiry": (
        "a big magnifying glass hovering over a small square coordinate grid "
        "tile with one diagonal line across it (no numbers, no labels)",
        False,
    ),
    "think": (
        "a teenage boy, blank featureless face with no eyes, no nose and no "
        "mouth, with short dark hair, resting his hand on his chin, thinking, a "
        "glowing lightbulb floating above his head, wearing a navy school polo "
        "shirt, half body portrait from the waist up",
        True,
    ),
    "teamwork": (
        "two teenage boys sitting side by side on a simple bench, working "
        "together on one tablet that they both look at, both with blank "
        "featureless faces with no eyes, no nose and no mouth, with short dark "
        "hair, both wearing navy school polo shirts and grey trousers",
        True,
    ),
    "watchout": (
        "a yellow triangular caution sign with a bold black exclamation mark, "
        "standing on top of a small orange and white traffic cone",
        False,
    ),
    "translation": (
        "a red skateboard gliding to the right, seen from the side at a slight "
        "angle, with three soft rounded motion lines behind it on the left",
        False,
    ),
    "dilation": (
        "a colorful coil spring lying horizontally being stretched, with two "
        "small arrows pointing outward from its two ends",
        False,
    ),
    "reflection": (
        "a standing oval mirror on a wooden stand, a red paper airplane in "
        "front of it, and the airplane's mirror image clearly visible inside "
        "the mirror",
        False,
    ),
    "tickets": (
        "two blank paper event tickets in soft coral and sunflower yellow with "
        "perforated stub edges and no text, overlapping each other, next to a "
        "white baseball with red stitching",
        False,
    ),
    "paint": (
        "two open paint cans, one filled with blue paint and one with yellow "
        "paint, a paintbrush resting across the top, and a few colorful paint "
        "splashes around them",
        False,
    ),
    "bowling": (
        "a glossy blue bowling ball rolling toward exactly three white bowling "
        "pins with red stripes (three pins only, not four)",
        False,
    ),
    "savings": (
        "a classic piggy bank in soft bubblegum pink (clearly pink, not coral "
        "or red) with a coin slot on top, with a few shiny gold coins stacked "
        "beside it",
        False,
    ),
    "boat": (
        "a small empty two-seat pedal boat (a simple boat shape, not a swan) "
        "floating on a small round patch of calm blue water",
        False,
    ),
    "phone-game": (
        "a smartphone with a navy blue body standing upright, its sky blue "
        "screen showing a simple coral game controller symbol, with a few "
        "colorful game pieces (rounded pawns, small blank cubes and round "
        "tokens) beside it",
        False,
    ),
    "headphones": (
        "a pair of over-ear headphones with one floating music note beside them",
        False,
    ),
    "bell": (
        "a golden hand school bell with a wooden handle, tilted as if ringing, "
        "with a few small curved motion lines beside it",
        False,
    ),
    "exit": (
        "an open wooden door seen at a slight angle, with a bright green "
        "arrow sign pointing out through the open doorway (the sign is just a "
        "green arrow shape, with no words)",
        False,
    ),
    "reflect": (
        "a teenage boy, blank featureless face with no eyes, no nose and no "
        "mouth, with short dark hair, sitting calmly at a small desk and writing "
        "in a notebook with a pencil, wearing a navy school polo shirt",
        True,
    ),
    "trophy": (
        "a shiny golden trophy cup with two handles on a small base, with small "
        "colorful confetti pieces and stars floating around it",
        False,
    ),
    "stopwatch": (
        "a classic red and silver stopwatch with a top button, its dial showing "
        "only simple tick marks and one hand (no numbers)",
        False,
    ),
    "explore": (
        "a thin modern tablet computer in landscape orientation (clearly a "
        "tablet, not a computer monitor or TV), leaning back on a small folding "
        "stand, its screen showing a square grid with three parallel diagonal "
        "lines in green, blue and red (no numbers, no labels)",
        False,
    ),
}

_log_lock = threading.Lock()
_print_lock = threading.Lock()
_pro_disabled = threading.Event()


class ContentBlocked(Exception):
    """The model answered but refused or returned no image (content issue)."""


class TransientError(Exception):
    """Network, quota or server error worth retrying."""


class ModelUnavailable(Exception):
    """The model name is not served (404) or the request shape is rejected."""


class BudgetExceeded(Exception):
    pass


def say(*parts: object) -> None:
    with _print_lock:
        print(*parts, flush=True)


def load_key() -> str:
    key = ""
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
    if not key:
        key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        sys.exit("GEMINI_API_KEY not found in .env or the environment.")
    return key


def mime_of(data: bytes) -> str:
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/png"


def ext_of(mime: str) -> str:
    return {"image/jpeg": "jpg", "image/webp": "webp"}.get(mime, "png")


def build_prompt(name: str, use_ref: bool, note: str = "") -> str:
    subject, has_person = ASSETS[name]
    text = subject.rstrip(".") + "."
    if note:
        text += " " + note.rstrip(".") + "."
    text += " " + (PERSON_RULE if has_person else OBJECT_RULE)
    text += " " + NO_TEXT_RULE
    text += " Style: " + STYLE
    if use_ref:
        return REF_PREFIX + text
    return text[0].upper() + text[1:]


class CallLog:
    def __init__(self, path: Path, budget: int):
        self.path = path
        self.budget = budget

    def count(self) -> int:
        if not self.path.exists():
            return 0
        return sum(1 for ln in self.path.read_text().splitlines() if ln.strip())

    def reserve(self, name: str, model: str) -> int:
        with _log_lock:
            n = self.count()
            if n >= self.budget:
                raise BudgetExceeded(f"budget of {self.budget} calls reached")
            self._append({"n": n + 1, "ts": time.strftime("%H:%M:%S"),
                          "name": name, "model": model, "status": "sent"})
            return n + 1

    def result(self, n: int, name: str, model: str, status: str, info: str = "") -> None:
        with _log_lock:
            res = self.path.with_name("results.jsonl")
            with res.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({"n": n, "ts": time.strftime("%H:%M:%S"),
                                     "name": name, "model": model,
                                     "status": status, "info": info[:400]}) + "\n")

    def _append(self, rec: dict) -> None:
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec) + "\n")


def call_api(key: str, model: str, prompt: str, ref: bytes | None,
             aspect: str, size: str, timeout: int) -> bytes:
    parts: list[dict] = [{"text": prompt}]
    if ref is not None:
        parts.append({"inline_data": {"mime_type": mime_of(ref),
                                      "data": base64.b64encode(ref).decode()}})
    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": aspect, "imageSize": size},
        },
    }
    req = urllib.request.Request(
        f"{API_BASE}/models/{model}:generateContent",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read())
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:300]
        if err.code in (408, 429, 500, 502, 503, 504):
            raise TransientError(f"HTTP {err.code}: {detail}") from None
        if err.code in (400, 404):
            raise ModelUnavailable(f"HTTP {err.code}: {detail}") from None
        raise TransientError(f"HTTP {err.code}: {detail}") from None
    except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as err:
        raise TransientError(f"network: {err}") from None

    feedback = payload.get("promptFeedback") or {}
    if feedback.get("blockReason"):
        raise ContentBlocked(f"prompt blocked: {feedback['blockReason']}")
    cands = payload.get("candidates") or []
    if not cands:
        raise ContentBlocked("no candidates returned")
    cand = cands[0]
    parts_out = (cand.get("content") or {}).get("parts") or []
    image = None
    texts = []
    for part in parts_out:
        blob = part.get("inlineData") or part.get("inline_data")
        if blob and not part.get("thought"):
            image = blob  # keep the LAST non-thought image part
        elif "text" in part and not part.get("thought"):
            texts.append(part["text"])
    if image is None:
        reason = cand.get("finishReason", "?")
        raise ContentBlocked(f"no image (finishReason={reason}) {' '.join(texts)[:200]}")
    return base64.b64decode(image["data"])


def next_path(out: Path, name: str, ext: str) -> Path:
    taken = [int(m.group(1)) for p in out.glob(f"{name}-*.*")
             if (m := re.fullmatch(rf"{re.escape(name)}-(\d+)\.\w+", p.name))]
    return out / f"{name}-{max(taken, default=0) + 1}.{ext}"


def generate_one(name: str, key: str, out: Path, log: CallLog, ref: bytes | None,
                 note: str, aspect: str, size: str, timeout: int,
                 pro_tries: int, flash_tries: int) -> Path | None:
    prompt = build_prompt(name, ref is not None, note)
    plan = []
    if not _pro_disabled.is_set():
        plan += [PRIMARY_MODEL] * pro_tries
    plan += [FALLBACK_MODEL] * flash_tries
    delay = 4.0
    for model in plan:
        if model == PRIMARY_MODEL and _pro_disabled.is_set():
            continue
        n = log.reserve(name, model)
        t0 = time.time()
        try:
            data = call_api(key, model, prompt, ref, aspect, size, timeout)
        except ContentBlocked as err:
            log.result(n, name, model, "blocked", str(err))
            say(f"[{n}] {name}: content issue on {model}: {err}")
            return None
        except ModelUnavailable as err:
            log.result(n, name, model, "unavailable", str(err))
            say(f"[{n}] {name}: {model} unavailable: {err}")
            if model == PRIMARY_MODEL:
                _pro_disabled.set()
            continue
        except TransientError as err:
            log.result(n, name, model, "transient", str(err))
            say(f"[{n}] {name}: transient error on {model}: {err}")
            time.sleep(delay)
            delay *= 2
            continue
        path = next_path(out, name, ext_of(mime_of(data)))
        path.write_bytes(data)
        log.result(n, name, model, "ok", path.name)
        say(f"[{n}] {name}: saved {path.name} via {model} in {time.time() - t0:.0f}s")
        return path
    say(f"{name}: all attempts failed")
    return None


def list_models(key: str) -> None:
    req = urllib.request.Request(f"{API_BASE}/models?pageSize=1000",
                                 headers={"x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    for m in data.get("models", []):
        name = m.get("name", "")
        if "image" in name or "imagen" in name:
            print(name, m.get("supportedGenerationMethods", []))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*", help="asset names to generate")
    ap.add_argument("--all", action="store_true", help="generate every asset")
    ap.add_argument("--skip", nargs="*", default=[], help="names to leave out with --all")
    ap.add_argument("--out", type=Path, help="folder for raw renders and the call log")
    ap.add_argument("--ref", type=Path, help="style reference image")
    ap.add_argument("--note", default="", help="extra instruction appended to the subject")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--budget", type=int, default=60, help="max calls recorded in calls.jsonl")
    ap.add_argument("--aspect", default="1:1")
    ap.add_argument("--size", default="1K")
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--pro-tries", type=int, default=3)
    ap.add_argument("--flash-tries", type=int, default=2)
    ap.add_argument("--print-prompt", action="store_true", help="show prompts and exit")
    ap.add_argument("--list-models", action="store_true")
    args = ap.parse_args()

    names = list(ASSETS) if args.all else args.names
    names = [n for n in names if n not in set(args.skip)]
    unknown = [n for n in names if n not in ASSETS]
    if unknown:
        sys.exit(f"unknown asset names: {unknown}")

    if args.print_prompt:
        for n in names:
            print(f"--- {n}\n{build_prompt(n, args.ref is not None, args.note)}\n")
        return

    key = load_key()
    if args.list_models:
        list_models(key)
        return
    if not names:
        sys.exit("nothing to do: pass asset names or --all")
    if args.out is None:
        sys.exit("--out is required")

    args.out.mkdir(parents=True, exist_ok=True)
    log = CallLog(args.out / "calls.jsonl", args.budget)
    ref = args.ref.read_bytes() if args.ref else None
    say(f"{len(names)} assets, calls so far: {log.count()}/{args.budget}")

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futs = {pool.submit(generate_one, n, key, args.out, log, ref, args.note,
                            args.aspect, args.size, args.timeout,
                            args.pro_tries, args.flash_tries): n for n in names}
        for fut in as_completed(futs):
            try:
                fut.result()
            except BudgetExceeded as err:
                say(f"{futs[fut]}: {err}")
    say(f"done, calls so far: {log.count()}/{args.budget}")


if __name__ == "__main__":
    main()
