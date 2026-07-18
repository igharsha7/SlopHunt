#!/usr/bin/env node
/**
 * Builds a 9:16 HyperFrames roast composition from pipeline data.
 *
 *   node video/generate-composition.mjs <payload.json> [outDir]
 *
 * Payload (superset of what Grok returns — see scripts/grok-script.mjs):
 *   { owner, name, slopScore, oneLiner, captionLines[], crimes[], audio? }
 *
 * When `captionLines` is present the video is caption-driven: every beat gets
 * its own hard cut, timed against the voiceover so the words on screen match
 * the words being spoken. Falls back to crime cards when there is no script.
 *
 * Deterministic: same payload in, byte-identical HTML out.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- timing */
const T = {
  hook: 2.6, // cold open — short, the voice starts immediately
  captionMin: 0.85, // floor so a 3-word beat still reads
  captionPerWord: 0.34, // ≈1.3x delivery
  captionGap: 0.06, // hard cut, not a dissolve
  scoreHold: 4.6,
  outro: 3.2,
};

const PALETTE = {
  paper: "#eeeeec",
  ink: "#000000",
  sun: "#ebd22f",
  pop: "#fb4a16",
  grape: "#4d17f5",
  candy: "#fa9dcd",
};

/**
 * Visual gags — one per caption card, cycling so no two neighbours repeat.
 * Inline SVG in the site's sticker vocabulary (never emoji: font-dependent and
 * uncontrollable). Each takes the card theme so the accent stays coherent.
 */
const GAGS = [
  // Starburst — "look at this"
  (t) =>
    `<svg viewBox="0 0 100 100" width="130" height="130" fill="none"><path d="M50 4l7 18 14-13-2 19 19-6-10 17 20 2-16 11 16 11-20 2 10 17-19-6 2 19-14-13-7 18-7-18-14 13 2-19-19 6 10-17-20-2 16-11-16-11 20-2-10-17 19 6-2-19 14 13z" stroke="${t.accent}" stroke-width="4" stroke-linejoin="round"/></svg>`,
  // Cartoon eyes — the site's signature
  (t) =>
    `<svg viewBox="0 0 200 100" width="190" height="95"><rect x="4" y="14" width="192" height="72" rx="36" fill="${t.accent}" stroke="${t.fg}" stroke-width="5"/><circle cx="68" cy="50" r="24" fill="#fff" stroke="${t.fg}" stroke-width="4"/><circle cx="132" cy="50" r="24" fill="#fff" stroke="${t.fg}" stroke-width="4"/><circle cx="76" cy="54" r="11" fill="${t.fg}"/><circle cx="140" cy="54" r="11" fill="${t.fg}"/></svg>`,
  // Skull — the reaction currency
  (t) =>
    `<svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="${t.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a9 9 0 0 0-9 9c0 2.8 1.3 4.6 3 5.7V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3.3c1.7-1.1 3-2.9 3-5.7a9 9 0 0 0-9-9Z"/><circle cx="9" cy="11" r="1.7" fill="${t.accent}" stroke="none"/><circle cx="15" cy="11" r="1.7" fill="${t.accent}" stroke="none"/><path d="M10 21v-2M14 21v-2M12 15v2"/></svg>`,
  // Blob flower — pure punctuation
  (t) =>
    `<svg viewBox="0 0 100 100" width="120" height="120"><path d="M50 6c8 0 13 7 13 14 6-4 15-3 19 3 5 6 3 14-2 19 7 2 12 8 12 15s-5 13-12 15c5 5 7 13 2 19-4 6-13 7-19 3 0 7-5 14-13 14s-13-7-13-14c-6 4-15 3-19-3-5-6-3-14 2-19-7-2-12-8-12-15s5-13 12-15c-5-5-7-13-2-19 4-6 13-7 19-3 0-7 5-14 13-14z" fill="${t.accent}"/></svg>`,
  // Downward arrow — the verdict dropping
  (t) =>
    `<svg viewBox="0 0 100 100" width="120" height="120" fill="none" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M50 12v62M26 52l24 24 24-24"/></svg>`,
];

/** Backgrounds cycle so every cut changes colour — the "viral" rhythm. */
const CAPTION_BGS = [
  { bg: PALETTE.paper, fg: PALETTE.ink, accent: PALETTE.pop },
  { bg: PALETTE.grape, fg: PALETTE.paper, accent: PALETTE.sun },
  { bg: PALETTE.sun, fg: PALETTE.ink, accent: PALETTE.grape },
  { bg: PALETTE.candy, fg: PALETTE.ink, accent: PALETTE.grape },
];

/**
 * Score ramp for the number, which sits on the deep purple card. The site's
 * light-background ramp drops to ~1.7:1 here, so this is a separate set of
 * bright-on-dark tints — same meaning, readable.
 */
function scoreColorOnGrape(score) {
  if (score >= 90) return "#ff7a45";
  if (score >= 75) return "#ffb020";
  if (score >= 50) return PALETTE.sun;
  return "#6ee7a0";
}

function verdictFor(score) {
  if (score >= 95) return "BEYOND SAVING";
  if (score >= 90) return "CRIME SCENE";
  if (score >= 80) return "DEEPLY UNWELL";
  if (score >= 70) return "STRUGGLING";
  if (score >= 55) return "MEDIOCRE";
  if (score >= 40) return "SUSPICIOUSLY FINE";
  return "ANNOYINGLY GOOD";
}

/** Keeps generated timings free of float dust like 21.500000000000004. */
const round = (n) => Math.round(n * 100) / 100;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Beat duration from word count, floored so short beats stay readable. */
export function beatDuration(line) {
  const words = String(line).trim().split(/\s+/).filter(Boolean).length;
  return round(Math.max(T.captionMin, words * T.captionPerWord));
}

/**
 * Regroups caption beats onto sentence boundaries.
 *
 * The writer is asked for 4-7 word beats, which happily splits a sentence
 * across two cards ("The README says this is" / "the last tool you'll ever
 * need") — the text on screen then reads as a fragment and the cut lands
 * mid-thought. This merges fragments forward until each card ends on real
 * punctuation, then splits anything too long back apart at a clause break so
 * one card never overflows the frame.
 */
/**
 * A sentence is the atomic unit — it is never hard-split, because a card
 * ending on "you will ever" is worse than a card that runs slightly long.
 * Over-long cards are split only at real clause breaks, and the type scales
 * down instead (see .beat-text sizing).
 */
const MAX_WORDS_PER_CARD = 16;

export function groupIntoSentences(lines) {
  const endsSentence = (s) => /[.!?:]["')\]]?$/.test(s.trim());
  const merged = [];

  for (const raw of lines) {
    const line = String(raw).trim();
    if (!line) continue;

    const prev = merged[merged.length - 1];
    // Continue the previous card when it was left hanging mid-sentence.
    if (prev && !endsSentence(prev)) {
      merged[merged.length - 1] = `${prev} ${line}`;
    } else {
      merged.push(line);
    }
  }

  // Split over-long cards at a clause break so nothing overflows the frame.
  const out = [];
  for (const card of merged) {
    const words = card.split(/\s+/);
    if (words.length <= MAX_WORDS_PER_CARD) {
      out.push(card);
      continue;
    }
    // Prefer an internal sentence end; fall back to a comma; else hard split.
    const parts = card.match(/[^.!?]+[.!?]+["')\]]?\s*/g) ?? [card];
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      const w = p.split(/\s+/);
      if (w.length <= MAX_WORDS_PER_CARD) {
        out.push(p);
      } else {
        // Clause break only — a comma or a dash. If there's neither, the
        // sentence ships whole and the type shrinks to fit.
        const at = (() => {
          const c = p.indexOf(", ");
          if (c > 3 && c < p.length - 6) return c + 1;
          const d = p.indexOf(" — ");
          if (d > 3 && d < p.length - 6) return d;
          return -1;
        })();
        if (at > 0) {
          out.push(p.slice(0, at).trim(), p.slice(at).trim());
        } else {
          out.push(p);
        }
      }
    }
  }

  return out.filter(Boolean);
}

/**
 * Lays out caption beats.
 *
 * `measured` — per-sentence timings from scripts/kokoro-timed.mjs — is the
 * accurate path: each card is pinned to the exact audio of the sentence being
 * spoken, so the words on screen cannot drift from the voice.
 *
 * The word-count estimate below is only a fallback for when there is no
 * voiceover at all. It is a guess, and a bad one: Kokoro does not speak every
 * word at the same rate ("already a cover band" is 4 words / 2.20s, "slop
 * score: thirty-two" is 3 words / 2.42s), which is what made captions drift.
 */
export function layoutCaptions(lines, startAt, audioDuration, measured) {
  if (Array.isArray(measured) && measured.length > 0) {
    return measured.map((b, i) => ({
      line: b.text,
      start: round(startAt + b.start),
      duration: b.duration,
      index: i,
    }));
  }

  const raw = lines.map(beatDuration);
  const rawTotal = raw.reduce((a, b) => a + b, 0);
  const scale = audioDuration && rawTotal > 0 ? audioDuration / rawTotal : 1;

  let cursor = startAt;
  return lines.map((line, i) => {
    const duration = round(raw[i] * scale);
    const beat = { line, start: round(cursor), duration, index: i };
    cursor = round(cursor + duration + T.captionGap);
    return beat;
  });
}

export function buildComposition(payload) {
  const {
    owner = "someone",
    name = "a-repo",
    slopScore = 0,
    oneLiner = "",
    crimes = [],
    captionLines = [],
    // { file, duration, beats? } — voiceover beside index.html. `beats` carries
    // measured per-sentence timings and is what keeps captions locked to speech.
    audio = null,
  } = payload;

  // Caption-driven when we have a script; otherwise fall back to crime cards.
  // Captions are regrouped onto sentence boundaries so a card never shows a
  // fragment and a cut never lands mid-thought.
  const beatsSource =
    captionLines.length > 0
      ? groupIntoSentences(captionLines)
      : crimes.slice(0, 4).map((c) => (typeof c === "string" ? c : c.evidence));

  // The voice covers hook + captions; the score/outro land after it.
  const captionsStart = T.hook;
  const voiceBudget = audio?.duration ? Math.max(0, audio.duration - T.hook) : null;
  const beats = layoutCaptions(beatsSource, captionsStart, voiceBudget, audio?.beats);

  const lastBeat = beats[beats.length - 1];
  const scoreStart = lastBeat ? round(lastBeat.start + lastBeat.duration + 0.15) : T.hook;
  const outroStart = round(scoreStart + T.scoreHold);
  const total = round(outroStart + T.outro);

  const accent = scoreColorOnGrape(slopScore);
  const verdict = verdictFor(slopScore);

  // Every scene wraps its content in a non-clip `.inner`. Exit tweens and their
  // hard kills target the wrapper, never the clip — the framework owns clip
  // visibility, and fading a clip leaves stale state when the renderer seeks
  // non-linearly into a later frame.
  const captionClips = beats
    .map(({ line, start, duration, index }) => {
      const theme = CAPTION_BGS[index % CAPTION_BGS.length];
      // Longer sentences step the type down rather than overflow the frame.
      const words = String(line).trim().split(/\s+/).length;
      const size = words > 12 ? 68 : words > 8 ? 84 : 104;
      const gag = GAGS[index % GAGS.length];
      return `      <div class="clip beat" id="beat-${index}" data-start="${start}" data-duration="${duration}" data-track-index="1" style="background:${theme.bg};color:${theme.fg}">
        <div class="inner">
          <div class="beat-gag" style="color:${theme.accent}">${gag(theme)}</div>
          <div class="beat-tick" style="background:${theme.accent}"></div>
          <div class="beat-text" style="font-size:${size}px">${esc(line)}</div>
        </div>
      </div>`;
    })
    .join("\n");

  // Fast in, no exit fade: hard cuts read as energy and avoid stale-state risk.
  const captionTweens = beats
    .map(({ start, index }) => {
      return `  tl.fromTo("#beat-${index} .beat-gag", { opacity: 0, scale: 0.5, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.34, ease: "back.out(2.4)" }, ${start})
     .fromTo("#beat-${index} .beat-text", { opacity: 0, y: 26, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power4.out" }, ${round(start + 0.08)})
     .fromTo("#beat-${index} .beat-tick", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power3.out" }, ${start});`;
    })
    .join("\n");

  // The renderer discovers media by id — an <audio> without one renders SILENT.
  const audioTrack = audio?.file
    ? `      <audio
        id="voiceover"
        class="clip"
        src="${esc(audio.file)}"
        data-start="0"
        data-duration="${round(audio.duration ?? total)}"
        data-track-index="0"
      ></audio>\n`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <!-- Font families are declared but not <link>ed: the producer resolves
         Google Fonts at compile/render time, and a raw external request can
         fail before canonicalization. -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 1080px; height: 1920px; overflow: hidden;
        background: ${PALETTE.paper};
        font-family: "Inter", sans-serif;
        color: ${PALETTE.ink};
      }
      #root::before {
        content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 5;
        background-image:
          linear-gradient(to right, rgba(0,0,0,.045) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,.045) 1px, transparent 1px);
        background-size: 120px 120px;
      }
      .display { font-family: "Oswald", sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -.02em; }
      .clip { position: absolute; inset: 0; display: flex; flex-direction: column; }
      .inner { display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: center; }

      /* ---------------------------------------------------------- hook */
      #hook { justify-content: center; padding: 0 80px; background: ${PALETTE.ink}; color: ${PALETTE.paper}; }
      #hook .eyebrow {
        font-family: "Oswald", sans-serif; font-size: 36px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .22em; color: ${PALETTE.sun};
      }
      #hook .repo { font-size: 132px; line-height: .92; margin-top: 30px; color: ${PALETTE.paper}; }
      #hook .owner { font-size: 42px; color: ${PALETTE.candy}; margin-top: 22px; font-weight: 700; }

      /* ------------------------------------------------------- captions */
      .beat { justify-content: center; padding: 0 80px; }
      .beat-gag { margin-bottom: 34px; transform-origin: left center; }
      .beat-tick { height: 14px; width: 220px; transform-origin: left center; margin-bottom: 46px; }
      .beat-text {
        font-family: "Oswald", sans-serif; font-weight: 700; text-transform: uppercase;
        font-size: 104px; line-height: 1.04; letter-spacing: -.02em;
      }

      /* --------------------------------------------------------- score */
      #score { justify-content: center; align-items: center; background: ${PALETTE.grape}; color: ${PALETTE.paper}; }
      #score .inner { align-items: center; }
      #score .label {
        font-family: "Oswald", sans-serif; font-size: 42px; letter-spacing: .28em;
        text-transform: uppercase; color: ${PALETTE.sun};
      }
      #score .number {
        font-family: "Oswald", sans-serif; font-weight: 700; font-size: 470px; line-height: .82;
        color: ${accent}; margin: 14px 0;
      }
      #score .verdict {
        font-family: "Oswald", sans-serif; font-weight: 700; font-size: 70px; text-transform: uppercase;
        border: 5px solid ${PALETTE.sun}; border-radius: 999px; padding: 16px 46px; color: ${PALETTE.sun};
      }
      #score .oneliner {
        font-size: 46px; font-weight: 700; line-height: 1.28; text-align: center;
        margin-top: 54px; padding: 0 80px;
      }

      /* --------------------------------------------------------- outro */
      #outro { justify-content: center; align-items: center; background: ${PALETTE.sun}; }
      #outro .inner { align-items: center; }
      #outro .wordmark { font-size: 158px; line-height: .9; }
      #outro .wordmark span { color: ${PALETTE.grape}; }
      #outro .tag { font-size: 46px; font-weight: 700; margin-top: 30px; text-align: center; }
      #outro .chip {
        margin-top: 46px; font-family: "Oswald", sans-serif; font-size: 40px; letter-spacing: .16em;
        text-transform: uppercase; background: ${PALETTE.ink}; color: ${PALETTE.sun};
        padding: 20px 46px; border-radius: 999px;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${total}"
      data-width="1080"
      data-height="1920"
    >
${audioTrack}      <div class="clip" id="hook" data-start="0" data-duration="${T.hook}" data-track-index="1">
        <div class="inner">
          <div class="eyebrow">Slop report</div>
          <div class="repo display">${esc(name)}</div>
          <div class="owner">@${esc(owner)}</div>
        </div>
      </div>

${captionClips}

      <div class="clip" id="score" data-start="${scoreStart}" data-duration="${T.scoreHold}" data-track-index="1">
        <div class="inner">
          <div class="label">Slop Score</div>
          <div class="number" id="score-number">0</div>
          <div class="verdict">${esc(verdict)}</div>
          <div class="oneliner">&ldquo;${esc(oneLiner)}&rdquo;</div>
        </div>
      </div>

      <div class="clip" id="outro" data-start="${outroStart}" data-duration="${T.outro}" data-track-index="1">
        <div class="inner">
          <div class="wordmark display">Slop<span>Hunt</span></div>
          <div class="tag">Submit your repo. Get roasted. Get ranked.</div>
          <div class="chip">slophunt</div>
        </div>
      </div>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // Hook — snappy, no exit fade (hard cut into the first caption).
      tl.fromTo("#hook .eyebrow", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }, 0.05)
        .fromTo("#hook .repo", { opacity: 0, y: 46, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power4.out" }, 0.15)
        .fromTo("#hook .owner", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, 0.4);

      // Captions — one hard cut per spoken beat.
${captionTweens}

      // Score reveal — the payoff, counted up fast.
      const counter = { v: 0 };
      tl.fromTo("#score .label", { opacity: 0 }, { opacity: 1, duration: 0.25 }, ${round(scoreStart + 0.05)})
        .fromTo(
          "#score .number",
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" },
          ${round(scoreStart + 0.15)}
        )
        .to(
          counter,
          {
            v: ${slopScore},
            duration: 1.1,
            ease: "power3.out",
            onUpdate: () => {
              document.getElementById("score-number").textContent = Math.round(counter.v);
            },
          },
          ${round(scoreStart + 0.2)}
        )
        .fromTo("#score .verdict", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }, ${round(scoreStart + 1.3)})
        .fromTo("#score .oneliner", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, ${round(scoreStart + 1.6)});

      // Outro
      tl.fromTo("#outro .wordmark", { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.8)" }, ${round(outroStart + 0.08)})
        .fromTo("#outro .tag", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, ${round(outroStart + 0.32)})
        .fromTo("#outro .chip", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, ${round(outroStart + 0.55)});

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
}

/* ------------------------------------------------------------------ CLI */
const isMain = process.argv[1] && process.argv[1].endsWith("generate-composition.mjs");
if (isMain) {
  const payloadPath = process.argv[2];
  const outDir = process.argv[3] ?? join(HERE, "roast-video");
  if (!payloadPath) {
    console.error("usage: generate-composition.mjs <payload.json> [outDir]");
    process.exit(1);
  }
  const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
  mkdirSync(outDir, { recursive: true });

  // Copy the voiceover next to index.html so the composition can reference it
  // by bare filename (the renderer resolves relative to the project dir).
  if (payload.audio?.path && existsSync(payload.audio.path)) {
    const file = basename(payload.audio.path);
    copyFileSync(payload.audio.path, join(outDir, file));
    payload.audio = { file, duration: payload.audio.duration };
  }

  const html = buildComposition(payload);
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`wrote ${join(outDir, "index.html")} (${html.length} bytes)`);
}
