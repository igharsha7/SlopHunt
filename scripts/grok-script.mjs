#!/usr/bin/env node
/**
 * Roast script generation via the Grok CLI, headless.
 *
 *   node scripts/grok-script.mjs <evidence.json> [out.json]
 *
 * Uses the locally-authenticated `grok` binary rather than the xAI HTTP API,
 * so no XAI_API_KEY is required — the CLI carries the user's own session.
 * `--json-schema` constrains the model, so the output is machine-parseable
 * without prose-stripping heuristics.
 */
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const GROK_BIN = process.env.GROK_BIN ?? join(homedir(), ".grok", "bin", "grok");

export const ROAST_SCHEMA = {
  type: "object",
  properties: {
    video_script: { type: "string" },
    page_roast: { type: "string" },
    one_liner: { type: "string" },
    tagline: { type: "string" },
    caption_lines: {
      type: "array",
      items: { type: "string" },
      description: "The video_script split into 4-7 word caption beats",
    },
  },
  required: ["video_script", "page_roast", "one_liner", "tagline", "caption_lines"],
  additionalProperties: false,
};

export function buildPrompt(evidence) {
  return `You are "Deepak from Code Review" — a burnt-out senior engineer who reviewed 40,000 pull requests. Dry, tired, devastating, secretly fair. Write a comedy roast of this repository.

HARD RULES, NON-NEGOTIABLE:
- Roast the SOFTWARE, never the person. No jokes about identity, nationality, appearance, gender, or intelligence.
- Every joke must cite a specific item from the crimes list below. No generic filler.
- Never reveal or guess any leaked secret value. Saying one exists is fine.
- If a crime mentions a leaked secret, tell them to rotate it today.

STYLE: This becomes a 9:16 vertical video with fast cuts and a synthetic voice at 1.3x speed. Short punchy sentences. Land a laugh every 3 seconds. No preamble, no "let's dive in".

video_script: 90-110 words, spoken aloud, cold open, ends by revealing the Slop Score.
caption_lines: the SAME script split into 4-7 word beats for on-screen captions. Every word from video_script must appear, in order.
page_roast: 150-250 words, paragraphs separated by blank lines.
one_liner: under 100 characters, the most brutal line.
tagline: under 80 characters, a Product-Hunt tagline rewritten with contempt.

EVIDENCE:
${JSON.stringify(evidence, null, 2)}`;
}

export async function generateWithGrokCli(evidence, { timeoutMs = 180_000 } = {}) {
  if (!existsSync(GROK_BIN)) {
    throw new Error(`grok CLI not found at ${GROK_BIN}`);
  }

  const { stdout } = await execFileAsync(
    GROK_BIN,
    [
      "-p",
      buildPrompt(evidence),
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(ROAST_SCHEMA),
      "--disable-web-search",
    ],
    { timeout: timeoutMs, maxBuffer: 12 * 1024 * 1024 },
  );

  return parseGrokOutput(stdout);
}

/**
 * The CLI may wrap the model payload in its own envelope, and may or may not
 * fence it. Dig out the first object that carries our fields.
 */
export function parseGrokOutput(stdout) {
  const candidates = [];

  const push = (v) => {
    if (v && typeof v === "object") candidates.push(v);
  };

  try {
    const envelope = JSON.parse(stdout);
    push(envelope);
    // The Grok CLI envelope puts the schema-constrained object on
    // `structuredOutput`, and the same payload as a JSON *string* on `text`.
    for (const key of [
      "structuredOutput",
      "text",
      "result",
      "response",
      "output",
      "content",
      "message",
      "data",
    ]) {
      const inner = envelope?.[key];
      if (typeof inner === "string") {
        try {
          push(JSON.parse(inner));
        } catch {
          /* not json */
        }
      } else {
        push(inner);
      }
    }
  } catch {
    /* stdout wasn't a single JSON doc */
  }

  // Fall back to the widest brace span in raw stdout.
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      push(JSON.parse(stdout.slice(start, end + 1)));
    } catch {
      /* ignore */
    }
  }

  for (const c of candidates) {
    const ok =
      typeof c.video_script === "string" &&
      typeof c.page_roast === "string" &&
      typeof c.one_liner === "string" &&
      typeof c.tagline === "string";
    if (ok) {
      return {
        videoScript: c.video_script.trim(),
        pageRoast: c.page_roast.trim(),
        oneLiner: c.one_liner.trim().slice(0, 100),
        tagline: c.tagline.trim().slice(0, 80),
        captionLines: Array.isArray(c.caption_lines)
          ? c.caption_lines.filter((l) => typeof l === "string" && l.trim()).map((l) => l.trim())
          : [],
        model: "grok-cli",
      };
    }
  }

  return null;
}

/* ------------------------------------------------------------------ CLI */
const isMain = process.argv[1]?.endsWith("grok-script.mjs");
if (isMain) {
  const inPath = process.argv[2];
  const outPath = process.argv[3];
  if (!inPath) {
    console.error("usage: grok-script.mjs <evidence.json> [out.json]");
    process.exit(1);
  }
  const evidence = JSON.parse(readFileSync(inPath, "utf8"));
  const result = await generateWithGrokCli(evidence);
  if (!result) {
    console.error("grok returned no parseable roast");
    process.exit(2);
  }
  const json = JSON.stringify(result, null, 2);
  if (outPath) {
    writeFileSync(outPath, json);
    console.error(`wrote ${outPath}`);
  } else {
    console.log(json);
  }
}
