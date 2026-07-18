#!/usr/bin/env node
/**
 * Kokoro TTS voiceover for the roast video.
 *
 *   node scripts/kokoro-tts.mjs <text-file|--text "..."> <out.wav> [voice] [speed]
 *
 * Runs Kokoro-82M locally through kokoro-js (transformers.js) — no API key, no
 * network after the first model download (~90 MB, cached under node_modules).
 *
 * Speed defaults to 1.3: Deepak is tired, not slow, and the fast delivery is
 * what makes the cuts land.
 */
import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

export const DEFAULT_VOICE = process.env.KOKORO_VOICE ?? "am_michael";
export const DEFAULT_SPEED = Number(process.env.KOKORO_SPEED ?? 1.3);
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

let ttsPromise = null;

/** The model is expensive to construct; reuse it across calls in one process. */
async function getTts() {
  if (!ttsPromise) {
    const { KokoroTTS } = await import("kokoro-js");
    ttsPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: "q8", // 8-bit: ~4x smaller, no audible loss at this length
      device: "cpu",
    });
  }
  return ttsPromise;
}

export async function listVoices() {
  const tts = await getTts();
  return Object.keys(tts.voices ?? {});
}

/**
 * Synthesizes `text` to a WAV at `outPath`.
 * Returns { outPath, durationSec, voice, speed, bytes }.
 */
export async function synthesize({
  text,
  outPath,
  voice = DEFAULT_VOICE,
  speed = DEFAULT_SPEED,
}) {
  if (!text || !text.trim()) throw new Error("synthesize: empty text");
  if (!outPath) throw new Error("synthesize: outPath required");

  const tts = await getTts();
  const audio = await tts.generate(text.trim(), { voice, speed });

  // RawAudio exposes toWav(); fall back to save() for older builds.
  if (typeof audio.toWav === "function") {
    await writeFile(outPath, Buffer.from(audio.toWav()));
  } else {
    await audio.save(outPath);
  }

  const { size } = await stat(outPath);

  // Prefer the sample-accurate duration over parsing the header back.
  const durationSec =
    audio.audio?.length && audio.sampling_rate
      ? audio.audio.length / audio.sampling_rate
      : null;

  return {
    outPath,
    durationSec: durationSec ? Math.round(durationSec * 100) / 100 : null,
    voice,
    speed,
    bytes: size,
  };
}

/* ------------------------------------------------------------------ CLI */
const isMain = process.argv[1]?.endsWith("kokoro-tts.mjs");
if (isMain) {
  const args = process.argv.slice(2);

  if (args[0] === "--voices") {
    console.log((await listVoices()).join("\n"));
    process.exit(0);
  }

  let text;
  let rest;
  if (args[0] === "--text") {
    text = args[1];
    rest = args.slice(2);
  } else {
    const src = args[0];
    if (!src || !existsSync(src)) {
      console.error("usage: kokoro-tts.mjs <text-file|--text \"...\"> <out.wav> [voice] [speed]");
      process.exit(1);
    }
    text = await readFile(src, "utf8");
    rest = args.slice(1);
  }

  const [outPath, voice = DEFAULT_VOICE, speed = DEFAULT_SPEED] = rest;
  if (!outPath) {
    console.error("out.wav path required");
    process.exit(1);
  }

  const result = await synthesize({
    text,
    outPath,
    voice,
    speed: Number(speed),
  });
  console.log(JSON.stringify(result));
}
