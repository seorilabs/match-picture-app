/**
 * 게임 오디오 에셋 생성기.
 *
 * 외부 사운드를 받아오지 않고 이 저장소에서 직접 합성한다(라이선스 문제 없음).
 * 출력: public/audio/bgm.wav(루프), public/audio/clear.wav, public/audio/combo.wav
 *
 * 실행: node scripts/generate-audio.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../public/audio");

function writeWav(path, samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  writeFileSync(path, buffer);
}

const noteFrequency = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);

/** 부드러운 삼각파 — 픽셀 게임 톤에 어울리고 귀에 자극이 적다. */
function triangle(phase) {
  const t = phase - Math.floor(phase);
  return 4 * Math.abs(t - 0.5) - 1;
}

function sine(phase) {
  return Math.sin(2 * Math.PI * phase);
}

function addTone(samples, { start, duration, frequency, gain, wave = triangle, attack = 0.01, release = 0.08 }) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const length = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const index = startIndex + i;
    if (index < 0 || index >= samples.length) continue;
    const time = i / SAMPLE_RATE;
    const remaining = duration - time;
    const envelope =
      Math.min(1, time / attack) * Math.min(1, Math.max(0, remaining) / release);
    samples[index] += wave(frequency * time) * gain * envelope;
  }
}

function makeSilence(seconds) {
  return new Float64Array(Math.floor(seconds * SAMPLE_RATE));
}

/** 루프 이음매가 들리지 않도록 마디 길이에 정확히 맞춘 배경음. */
function buildBgm() {
  const beat = 0.4;
  const bars = 6;
  const beatsPerBar = 4;
  const total = beat * bars * beatsPerBar;
  const samples = makeSilence(total);

  // C major pentatonic 계열 — 캐주얼 퍼즐에 무난하고 반복해도 피로하지 않다.
  const melody = [3, 7, 10, 7, 5, 3, 0, 3, 7, 12, 10, 7, 5, 3, 5, 7];
  const bass = [-9, -9, -4, -4, -7, -7, -9, -9];

  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * beatsPerBar * beat;
    for (let step = 0; step < beatsPerBar * 2; step++) {
      const index = (bar * beatsPerBar * 2 + step) % melody.length;
      addTone(samples, {
        start: barStart + step * (beat / 2),
        duration: beat / 2,
        frequency: noteFrequency(melody[index]),
        gain: 0.12,
        attack: 0.02,
        release: 0.12,
      });
    }
    for (let step = 0; step < beatsPerBar; step++) {
      const index = (bar * beatsPerBar + step) % bass.length;
      addTone(samples, {
        start: barStart + step * beat,
        duration: beat * 0.9,
        frequency: noteFrequency(bass[index]),
        gain: 0.1,
        wave: sine,
        attack: 0.03,
        release: 0.2,
      });
    }
  }
  return samples;
}

/** 클리어 팡파레 — 상승 아르페지오 + 마무리 코드. */
function buildClear() {
  const samples = makeSilence(1.5);
  const arpeggio = [0, 4, 7, 12];
  arpeggio.forEach((semitone, index) => {
    addTone(samples, {
      start: index * 0.11,
      duration: 0.3,
      frequency: noteFrequency(semitone),
      gain: 0.22,
      release: 0.15,
    });
  });
  [0, 4, 7, 16].forEach((semitone) => {
    addTone(samples, {
      start: 0.46,
      duration: 0.9,
      frequency: noteFrequency(semitone),
      gain: 0.16,
      release: 0.5,
    });
  });
  return samples;
}

/** 콤보 상승음 — 짧게 두 번 올라가는 블립. */
function buildCombo() {
  const samples = makeSilence(0.35);
  [12, 19].forEach((semitone, index) => {
    addTone(samples, {
      start: index * 0.08,
      duration: 0.16,
      frequency: noteFrequency(semitone),
      gain: 0.2,
      wave: sine,
      release: 0.1,
    });
  });
  return samples;
}

function normalize(samples, peak = 0.9) {
  let max = 0;
  for (const sample of samples) max = Math.max(max, Math.abs(sample));
  if (max === 0) return samples;
  const scale = peak / max;
  for (let i = 0; i < samples.length; i++) samples[i] *= scale;
  return samples;
}

mkdirSync(OUT_DIR, { recursive: true });
writeWav(resolve(OUT_DIR, "bgm.wav"), normalize(buildBgm(), 0.55));
writeWav(resolve(OUT_DIR, "clear.wav"), normalize(buildClear(), 0.85));
writeWav(resolve(OUT_DIR, "combo.wav"), normalize(buildCombo(), 0.8));
console.log(`generated bgm.wav, clear.wav, combo.wav in ${OUT_DIR}`);
