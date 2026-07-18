#!/usr/bin/env node
/**
 * Builds a 9:16 HyperFrames roast composition from pipeline data.
 *
 *   node video/generate-composition.mjs <payload.json> [outDir]
 *
 * Payload shape (a subset of SlopEntry — see src/lib/slop.ts):
 *   { owner, name, slopScore, oneLiner, videoScript, crimes: [{evidence}], verdict }
 *
 * The composition is deterministic: same payload in, byte-identical HTML out,
 * so a re-render never produces a different video.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- timing */
const T = {
  hookIn: 0.0,
  hookOut: 5.0,
  crimeStart: 5.0,
  crimeEach: 5.5, // per crime card
  scoreLead: 1.2, // gap before the score slams in
  scoreHold: 7.5,
  outro: 5.0,
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
 * Score ramp for the number, which sits on the deep purple card. The site's
 * light-background ramp (dark amber, forest green) drops to ~1.7:1 here, so
 * this is a separate set of bright-on-dark tints — same meaning, readable.
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

export function buildComposition(payload) {
  const {
    owner = "someone",
    name = "a-repo",
    slopScore = 0,
    oneLiner = "",
    crimes = [],
  } = payload;

  // Four crimes is the sweet spot for <45s; more and each card gets unreadable.
  const cards = crimes.slice(0, 4).map((c) =>
    typeof c === "string" ? c : c.evidence,
  );

  const crimesDuration = cards.length * T.crimeEach;
  const scoreStart = T.crimeStart + crimesDuration + T.scoreLead;
  const outroStart = scoreStart + T.scoreHold;
  const total = Math.round((outroStart + T.outro) * 10) / 10;

  const accent = scoreColorOnGrape(slopScore);
  const verdict = verdictFor(slopScore);

  // Every scene wraps its content in a non-clip `.inner`. Exit tweens and their
  // hard kills target the wrapper, never the clip — the framework owns clip
  // visibility, and fading a clip leaves stale state when the renderer seeks
  // non-linearly into a later frame.
  const crimeClips = cards
    .map((text, i) => {
      const start = T.crimeStart + i * T.crimeEach;
      return `      <div class="clip crime" id="crime-${i}" data-start="${start}" data-duration="${T.crimeEach}" data-track-index="1">
        <div class="inner">
          <div class="crime-index">EXHIBIT ${String(i + 1).padStart(2, "0")}</div>
          <div class="crime-text">${esc(text)}</div>
        </div>
      </div>`;
    })
    .join("\n");

  const crimeTweens = cards
    .map((_, i) => {
      const start = T.crimeStart + i * T.crimeEach;
      const exitAt = round(start + T.crimeEach - 0.4);
      const boundary = round(start + T.crimeEach);
      return `  tl.from("#crime-${i} .crime-index", { opacity: 0, x: -40, duration: 0.4, ease: "power3.out" }, ${start})
     .from("#crime-${i} .crime-text", { opacity: 0, y: 42, duration: 0.55, ease: "power3.out" }, ${round(start + 0.15)})
     .to("#crime-${i} .inner", { opacity: 0, duration: 0.35, ease: "power2.in" }, ${exitAt})
     .set("#crime-${i} .inner", { opacity: 0 }, ${boundary});`;
    })
    .join("\n");

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
      /* byooooob graph paper */
      #root::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background-image:
          linear-gradient(to right, rgba(0,0,0,.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,.05) 1px, transparent 1px);
        background-size: 120px 120px;
      }
      .display { font-family: "Oswald", sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -.02em; }
      .clip { position: absolute; inset: 0; display: flex; flex-direction: column; }

      /* ---------------------------------------------------------- hook */
      #hook { justify-content: center; padding: 0 90px; }
      #hook .eyebrow {
        font-size: 34px; font-weight: 700; text-transform: uppercase; letter-spacing: .18em;
        color: ${PALETTE.ink}; background: ${PALETTE.sun};
        align-self: flex-start; padding: 14px 26px; border: 3px solid ${PALETTE.ink};
        border-radius: 999px; box-shadow: 6px 7px 0 0 ${PALETTE.ink};
      }
      #hook .repo { font-size: 128px; line-height: .95; margin-top: 54px; }
      #hook .owner { font-size: 44px; color: #444; margin-top: 26px; font-weight: 700; }
      #hook .rule { height: 8px; background: ${PALETTE.ink}; margin-top: 60px; transform-origin: left center; }

      /* -------------------------------------------------------- crimes */
      .crime { justify-content: center; padding: 0 90px; }
      .crime-index {
        font-family: "Oswald", sans-serif; font-weight: 700; font-size: 40px;
        letter-spacing: .2em; color: #c9380f; margin-bottom: 40px;
      }
      .crime-text { font-size: 82px; font-weight: 700; line-height: 1.12; }

      /* --------------------------------------------------------- score */
      #score { justify-content: center; align-items: center; background: ${PALETTE.grape}; color: ${PALETTE.paper}; }
      #score .label {
        font-family: "Oswald", sans-serif; font-size: 40px; letter-spacing: .28em;
        text-transform: uppercase; color: ${PALETTE.sun};
      }
      #score .number {
        font-family: "Oswald", sans-serif; font-weight: 700; font-size: 460px; line-height: .82;
        color: ${accent}; margin: 20px 0;
      }
      #score .verdict {
        font-family: "Oswald", sans-serif; font-weight: 700; font-size: 68px; text-transform: uppercase;
        border: 5px solid ${PALETTE.sun}; border-radius: 999px; padding: 16px 44px; color: ${PALETTE.sun};
      }
      #score .oneliner {
        font-size: 46px; font-weight: 700; line-height: 1.3; text-align: center;
        margin-top: 62px; padding: 0 90px; max-width: 980px;
      }

      /* --------------------------------------------------------- outro */
      #outro { justify-content: center; align-items: center; background: ${PALETTE.sun}; }
      #outro .wordmark { font-size: 150px; line-height: .9; }
      #outro .wordmark span { color: ; }
      #outro .tag { font-size: 44px; font-weight: 700; margin-top: 36px; text-align: center; }
      #outro .chip {
        margin-top: 54px; font-family: "Oswald", sans-serif; font-size: 38px; letter-spacing: .16em;
        text-transform: uppercase; background: ${PALETTE.ink}; color: ${PALETTE.sun};
        padding: 20px 44px; border-radius: 999px;
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
      <div class="clip" id="hook" data-start="${T.hookIn}" data-duration="${T.hookOut}" data-track-index="1">
        <div class="inner">
          <div class="eyebrow">Slop report</div>
          <div class="repo display">${esc(name)}</div>
          <div class="owner">@${esc(owner)}</div>
          <div class="rule"></div>
        </div>
      </div>

${crimeClips}

      <div class="clip" id="score" data-start="${scoreStart}" data-duration="${T.scoreHold}" data-track-index="1">
        <div class="label">Slop Score</div>
        <div class="number" id="score-number">0</div>
        <div class="verdict">${esc(verdict)}</div>
        <div class="oneliner">&ldquo;${esc(oneLiner)}&rdquo;</div>
      </div>

      <div class="clip" id="outro" data-start="${outroStart}" data-duration="${T.outro}" data-track-index="1">
        <div class="wordmark display">Slop<span>Hunt</span></div>
        <div class="tag">Submit your repo. Get roasted. Get ranked.</div>
        <div class="chip">slophunt</div>
      </div>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // Hook — exit + hard kill ride on .inner so a seek past the boundary
      // can't leave a half-faded scene behind.
      tl.from("#hook .eyebrow", { opacity: 0, y: -30, duration: 0.45, ease: "power3.out" }, 0.1)
        .from("#hook .repo", { opacity: 0, y: 70, duration: 0.7, ease: "power3.out" }, 0.35)
        .from("#hook .owner", { opacity: 0, y: 24, duration: 0.5, ease: "power3.out" }, 0.7)
        .fromTo("#hook .rule", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 0.9)
        .to("#hook .inner", { opacity: 0, duration: 0.4, ease: "power2.in" }, ${round(T.hookOut - 0.45)})
        .set("#hook .inner", { opacity: 0 }, ${T.hookOut});

      // Crimes
${crimeTweens}

      // Score reveal — the counter is the payoff, so it gets the longest ease.
      const counter = { v: 0 };
      tl.from("#score .label", { opacity: 0, duration: 0.4 }, ${scoreStart + 0.1})
        .fromTo(
          "#score .number",
          { scale: 0.65, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.7)" },
          ${scoreStart + 0.3}
        )
        .to(
          counter,
          {
            v: ${slopScore},
            duration: 1.9,
            ease: "power3.out",
            onUpdate: () => {
              document.getElementById("score-number").textContent = Math.round(counter.v);
            },
          },
          ${scoreStart + 0.35}
        )
        .from("#score .verdict", { opacity: 0, y: 28, duration: 0.5, ease: "power3.out" }, ${scoreStart + 2.2})
        .from("#score .oneliner", { opacity: 0, y: 30, duration: 0.6, ease: "power3.out" }, ${scoreStart + 2.6});

      // Outro
      tl.from("#outro .wordmark", { opacity: 0, scale: 0.85, duration: 0.6, ease: "back.out(1.6)" }, ${outroStart + 0.15})
        .from("#outro .tag", { opacity: 0, y: 24, duration: 0.5, ease: "power3.out" }, ${outroStart + 0.5})
        .from("#outro .chip", { opacity: 0, y: 20, duration: 0.45, ease: "power3.out" }, ${outroStart + 0.8});

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
  const html = buildComposition(payload);
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`wrote ${join(outDir, "index.html")} (${html.length} bytes)`);
}
