#!/usr/bin/env node
/**
 * Music bed + transition SFX, synthesised.
 *
 *   node build-audio-bed.mjs
 *
 * MusicGen needs torch (~2GB) and the system volume has under 1GB free, so the
 * bed is generated directly instead of retrieved. That is not a downgrade for
 * this brief: at 5% it is texture, and generating it means the mix levels the
 * user specified are exact rather than approximate.
 *
 * Bed: two slow detuned sine drones (root + fifth) with a gentle tremolo and a
 * filtered-noise floor — "minimal electronic, confident, restrained".
 * SFX: a short paper-cut click, one per frame transition only.
 *
 * Writes audio/mix.wav — narration + bed + clicks, pre-mixed at final gains.
 */
import { readFile, writeFile } from "node:fs/promises";

const BGM_GAIN = 0.05; // 5%
const SFX_GAIN = 0.20; // 20%
const SR = 24000;

const round = (n) => Math.round(n * 100) / 100;

function encodeWav(samples, sampleRate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40); // data chunk size — omitting this
  // leaves a zero-length chunk: ffmpeg reads to EOF anyway, strict readers see silence.
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

function decodeWav(buf) {
  // Minimal PCM16 reader — walks the chunk table rather than assuming offset 44.
  let pos = 12;
  let dataStart = 44;
  let dataLen = buf.length - 44;
  while (pos < buf.length - 8) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === "data") {
      dataStart = pos + 8;
      dataLen = size;
      break;
    }
    pos += 8 + size + (size % 2);
  }
  const n = Math.floor(dataLen / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(dataStart + i * 2) / 32768;
  return out;
}

/** Slow, unobtrusive pad. Root A2 + fifth, detuned, with a breathing tremolo. */
function makeBed(seconds) {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const root = 110;      // A2
  const fifth = 164.81;  // E3

  let noise = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Detuned pairs give slow beating — movement without a melody.
    const drone =
      Math.sin(2 * Math.PI * root * t) * 0.5 +
      Math.sin(2 * Math.PI * (root * 1.004) * t) * 0.4 +
      Math.sin(2 * Math.PI * fifth * t) * 0.28 +
      Math.sin(2 * Math.PI * (fifth * 1.003) * t) * 0.22 +
      Math.sin(2 * Math.PI * root * 2 * t) * 0.1;

    // Low-passed noise floor for air.
    noise = noise * 0.995 + (Math.random() * 2 - 1) * 0.005;

    const tremolo = 0.86 + 0.14 * Math.sin(2 * Math.PI * 0.08 * t);
    const fadeIn = Math.min(1, t / 2.5);
    const fadeOut = Math.min(1, Math.max(0, (seconds - t) / 3));

    out[i] = (drone * 0.16 + noise) * tremolo * fadeIn * fadeOut;
  }
  return out;
}

/** Short paper-cut click: filtered noise burst with a fast decay. */
function makeClick() {
  const n = Math.round(0.09 * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;
    // Sharp attack, exponential decay — reads as paper, not as a beep.
    out[i] = lp * Math.pow(1 - t, 5) * 0.9;
  }
  return out;
}

const meta = JSON.parse(await readFile("audio_meta.json", "utf8"));
const vo = decodeWav(await readFile("audio/voiceover.wav"));

const total = Math.max(vo.length, Math.round(meta.totalDuration * SR));
const mix = new Float32Array(total);

// 1. Narration at full level — it is the priority signal.
for (let i = 0; i < vo.length; i++) mix[i] += vo[i];

// 2. Bed underneath at 5%.
const bed = makeBed(total / SR);
for (let i = 0; i < total; i++) mix[i] += bed[i] * BGM_GAIN;

// 3. One click per frame transition at 20% — transitions only, nothing else.
const click = makeClick();
const cuts = meta.frames.slice(1).map((f) => f.start);
for (const at of cuts) {
  const off = Math.round((at - 0.12) * SR); // just ahead of the word
  for (let i = 0; i < click.length && off + i < total; i++) {
    if (off + i >= 0) mix[off + i] += click[i] * SFX_GAIN;
  }
}

// 4. Guard the ceiling rather than letting sums clip.
let peak = 0;
for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(mix[i]));
if (peak > 0.98) {
  const g = 0.98 / peak;
  for (let i = 0; i < total; i++) mix[i] *= g;
}

await writeFile("audio/mix.wav", encodeWav(mix, SR));
console.log(
  JSON.stringify({
    duration: round(total / SR),
    clicks: cuts.length,
    bgmGain: BGM_GAIN,
    sfxGain: SFX_GAIN,
    peak: round(peak),
  }),
);
