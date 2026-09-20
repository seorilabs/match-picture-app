#!/usr/bin/env python3
"""효과음 2종을 결정론적 물리 모델 WAV 로 만든다.

외부 사운드를 받아오지 않고 저장소 안에서 합성한다. 원본 Unity 가 쓰던 효과음 2개는
출처가 어디에도 기록돼 있지 않아 교체했다(NOTICE 참고). 같은 코드가 언제나 같은 WAV 를
만들므로 --check 로 재현성을 검사할 수 있다.

실행: python3 tools/generate_sfx.py
검사: python3 tools/generate_sfx.py --check
"""
from __future__ import annotations

import argparse
import json
import math
import random
import sys
import wave
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "godot/assets/audio"
MANIFEST = AUDIO_DIR / "sound-manifest.json"
SAMPLE_RATE = 44_100

SFX_NAMES = ("correct", "wrong")

# 정답이 오답보다 밝고 크게 들려야 한다. 오답은 1.5초 잠금 동안 울리므로 눌러 둔다.
TARGET_PEAKS = {"correct": 0.62, "wrong": 0.44}


def add_modal(
    samples: list[float],
    start: float,
    length: float,
    modes: tuple[tuple[float, float, float], ...],
    gain: float = 1.0,
) -> None:
    """주파수·세기·감쇠율로 나무의 공진을 더한다."""
    start_frame = round(start * SAMPLE_RATE)
    frame_count = min(round(length * SAMPLE_RATE), len(samples) - start_frame)
    attack_frames = max(round(0.0015 * SAMPLE_RATE), 1)
    for frame in range(max(frame_count, 0)):
        t = frame / SAMPLE_RATE
        attack = min(frame / attack_frames, 1.0)
        value = 0.0
        for frequency, amplitude, decay in modes:
            value += amplitude * math.sin(math.tau * frequency * t) * math.exp(-decay * t)
        samples[start_frame + frame] += value * attack * gain


def add_wood_strike(
    samples: list[float], start: float, length: float, base: float, gain: float, seed: int
) -> None:
    """나무를 튕긴 소리. 배음 셋과 아주 짧은 잡음 어택으로 만든다."""
    add_modal(
        samples,
        start,
        length,
        (
            (base, 1.0, 15.0),
            (base * 2.67, 0.35, 24.0),
            (base * 4.05, 0.16, 38.0),
        ),
        gain,
    )
    start_frame = round(start * SAMPLE_RATE)
    count = min(round(0.018 * SAMPLE_RATE), len(samples) - start_frame)
    rng = random.Random(seed)
    smoothed = 0.0
    for frame in range(max(count, 0)):
        smoothed = smoothed * 0.55 + rng.uniform(-1.0, 1.0) * 0.45
        envelope = math.exp(-frame / SAMPLE_RATE * 170.0)
        samples[start_frame + frame] += smoothed * envelope * gain * 0.32


def render(name: str, duration: float) -> list[float]:
    samples = [0.0] * round(duration * SAMPLE_RATE)
    if name == "correct":
        # 나무 타격 뒤 두 음이 올라간다. C6 → G6.
        add_wood_strike(samples, 0.002, 0.16, 1046.50, 0.70, 101)
        add_wood_strike(samples, 0.085, 0.24, 1567.98, 0.62, 102)
        add_modal(samples, 0.085, 0.24, ((1567.98 * 2.01, 0.30, 11.0),), 0.34)
    elif name == "wrong":
        # 낮아지는 두 개의 부드러운 나무 음. 날카로운 buzzer 를 쓰지 않는다.
        add_wood_strike(samples, 0.006, 0.26, 293.66, 0.62, 201)
        add_wood_strike(samples, 0.130, 0.34, 220.00, 0.54, 202)
    else:
        raise ValueError(f"지원하지 않는 효과음: {name}")

    # DC 를 없애고 soft clip 후 지정 peak 로 맞춘다. 마지막 12ms 는 0 으로 보내 클릭을 막는다.
    mean = sum(samples) / max(len(samples), 1)
    shaped = [math.tanh((sample - mean) * 1.25) for sample in samples]
    fade_frames = min(round(0.012 * SAMPLE_RATE), len(shaped))
    for index in range(fade_frames):
        shaped[-fade_frames + index] *= 1.0 - index / max(fade_frames - 1, 1)
    peak = max((abs(sample) for sample in shaped), default=0.0)
    if peak <= 0.0:
        raise ValueError(f"무음이 생성됐다: {name}")
    scale = TARGET_PEAKS[name] / peak
    return [sample * scale for sample in shaped]


def write_wav(path: Path, samples: list[float]) -> None:
    pcm = array("h", (round(max(-1.0, min(1.0, sample)) * 32767) for sample in samples))
    if sys.byteorder != "little":
        pcm.byteswap()
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="*", choices=SFX_NAMES)
    parser.add_argument("--check", action="store_true", help="파일을 쓰지 않고 기존 결과와 비교한다")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    tracks = {track["name"]: track for track in manifest["tracks"]}
    for name in args.only or list(SFX_NAMES):
        if name not in tracks:
            raise SystemExit(f"매니페스트에 효과음이 없다: {name}")
        track = tracks[name]
        if track.get("type") != "oneshot":
            raise SystemExit(f"oneshot 이 아니다: {name}")
        samples = render(name, float(track["duration"]))
        path = AUDIO_DIR / f"{name}.wav"
        if args.check:
            import tempfile

            with tempfile.TemporaryDirectory() as raw:
                generated = Path(raw) / path.name
                write_wav(generated, samples)
                if not path.is_file() or path.read_bytes() != generated.read_bytes():
                    raise SystemExit(f"재생성이 필요한 효과음: {path.relative_to(ROOT)}")
            print(f"  ok  {name} 재현 일치")
        else:
            write_wav(path, samples)
            print(f"  wrote {path.relative_to(ROOT)} ({len(samples) / SAMPLE_RATE:.3f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
