#!/usr/bin/env node
/**
 * Narration + karaoke word timings for the launch video.
 *
 *   node build-narration.mjs
 *
 * Synthesises each frame's narration as its own clip so the frame durations
 * come from MEASURED audio rather than a word-count estimate. Within a frame,
 * word timings are apportioned by syllable weight — an approximation, but a
 * far better one than equal-split, and it only has to be right enough to move
 * a highlight across a line that is already correctly placed in time.
 *
 * Writes: audio/vo-NN.wav, audio/voiceover.wav, audio_meta.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";

const VOICE = process.env.KOKORO_VOICE ?? "am_michael";
const SPEED = Number(process.env.KOKORO_SPEED ?? 1.05);
const GAP = 0.45; // breath between frames

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

/** Rough syllable count — drives how long a word holds the highlight. */
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 1;
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (w.endsWith("e") && n > 1) n--;
  return Math.max(1, n);
}

/** Spreads a measured clip duration across its words by syllable weight. */
function wordTimings(text, start, duration) {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => syllables(w) + (/[.,!?—:]$/.test(w) ? 0.9 : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  let cursor = start;
  return words.map((word, i) => {
    const d = (weights[i] / total) * duration;
    const t = { word, start: round(cursor), duration: round(d) };
    cursor += d;
    return t;
  });
}

const frames = JSON.parse(readFileSync("narration.json", "utf8"));
const { KokoroTTS } = await import("kokoro-js");
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  dtype: "q8",
  device: "cpu",
});

await mkdir("audio", { recursive: true });

const chunks = [];
const meta = [];
let sampleRate = 24000;
let cursor = 0;

for (let i = 0; i < frames.length; i++) {
  const { beat, text } = frames[i];
  const audio = await tts.generate(text, { voice: VOICE, speed: SPEED });
  sampleRate = audio.sampling_rate ?? sampleRate;

  const duration = audio.audio.length / sampleRate;
  const id = String(i + 1).padStart(2, "0");

  await writeFile(`audio/vo-${id}.wav`, encodeWav(audio.audio, sampleRate));

  meta.push({
    frame: i + 1,
    id,
    beat,
    text,
    start: round(cursor),
    duration: round(duration),
    // Frame holds the voice plus the breath that follows it.
    frameDuration: round(duration + GAP),
    words: wordTimings(text, cursor, duration),
  });

  chunks.push(audio.audio, new Float32Array(Math.round(GAP * sampleRate)));
  cursor += duration + GAP;
  console.error(`  ${id} ${beat} — ${round(duration)}s`);
}

const total = chunks.reduce((n, c) => n + c.length, 0);
const merged = new Float32Array(total);
let off = 0;
for (const c of chunks) {
  merged.set(c, off);
  off += c.length;
}
await writeFile("audio/voiceover.wav", encodeWav(merged, sampleRate));

const out = {
  voice: VOICE,
  speed: SPEED,
  sampleRate,
  totalDuration: round(merged.length / sampleRate),
  frames: meta,
};
await writeFile("audio_meta.json", JSON.stringify(out, null, 2));
console.error(`\ntotal narration: ${out.totalDuration}s`);
console.log(JSON.stringify({ totalDuration: out.totalDuration, frames: meta.length }));
