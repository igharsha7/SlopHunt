#!/usr/bin/env node
/**
 * Sentence-timed Kokoro voiceover.
 *
 *   node scripts/kokoro-timed.mjs <script.json> <out.wav> [voice] [speed]
 *
 * The previous approach synthesised the whole script as one clip and then
 * divided the caption cards across it in proportion to their word counts.
 * That is a guess: Kokoro does not speak every word at the same rate, so the
 * text on screen drifted out of step with the voice.
 *
 * This synthesises each sentence on its own, MEASURES the audio it produced,
 * and returns the exact start/duration of every line. Captions are then timed
 * to real numbers rather than an estimate, so they cannot drift.
 *
 * Emits JSON: { outPath, durationSec, beats: [{ text, start, duration }] }
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export const DEFAULT_VOICE = process.env.KOKORO_VOICE ?? "am_michael";
export const DEFAULT_SPEED = Number(process.env.KOKORO_SPEED ?? 1.15);
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

/** Silence inserted between sentences so cuts land in a gap, not on a word. */
const GAP_SEC = 0.22;

let ttsPromise = null;
async function getTts() {
  if (!ttsPromise) {
    const { KokoroTTS } = await import("kokoro-js");
    ttsPromise = KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "cpu" });
  }
  return ttsPromise;
}

/** Minimal 16-bit PCM WAV writer — avoids an ffmpeg dependency for concat. */
function encodeWav(samples, sampleRate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

const round = (n) => Math.round(n * 100) / 100;

/**
 * Synthesises each line, concatenates with gaps, and reports measured timings.
 */
export async function synthesizeTimed({
  lines,
  outPath,
  voice = DEFAULT_VOICE,
  speed = DEFAULT_SPEED,
}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("synthesizeTimed: lines[] required");
  }

  const tts = await getTts();
  const chunks = [];
  const beats = [];
  let sampleRate = 24000;
  let cursor = 0;

  for (const raw of lines) {
    const text = String(raw).trim();
    if (!text) continue;

    const audio = await tts.generate(text, { voice, speed });
    sampleRate = audio.sampling_rate ?? sampleRate;
    const samples = audio.audio;
    const duration = samples.length / sampleRate;

    beats.push({
      text,
      start: round(cursor),
      // The card stays up for its own speech plus the gap that follows, so
      // there is never a frame of dead air with no caption on screen.
      duration: round(duration + GAP_SEC),
    });

    chunks.push(samples);
    chunks.push(new Float32Array(Math.round(GAP_SEC * sampleRate))); // silence
    cursor += duration + GAP_SEC;
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  await writeFile(outPath, encodeWav(merged, sampleRate));

  return {
    outPath,
    durationSec: round(merged.length / sampleRate),
    voice,
    speed,
    beats,
  };
}

/* ------------------------------------------------------------------ CLI */
const isMain = process.argv[1]?.endsWith("kokoro-timed.mjs");
if (isMain) {
  const [scriptPath, outPath, voice = DEFAULT_VOICE, speed = DEFAULT_SPEED] =
    process.argv.slice(2);

  if (!scriptPath || !existsSync(scriptPath) || !outPath) {
    console.error('usage: kokoro-timed.mjs <script.json {"lines":[...]}> <out.wav> [voice] [speed]');
    process.exit(1);
  }

  const parsed = JSON.parse(await readFile(scriptPath, "utf8"));
  const lines = Array.isArray(parsed) ? parsed : parsed.lines;

  const result = await synthesizeTimed({
    lines,
    outPath,
    voice,
    speed: Number(speed),
  });
  console.log(JSON.stringify(result));
}
