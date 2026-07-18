import "server-only";

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import type { Receipt } from "@/lib/slop";
import type { CrawlResult } from "./github";
import { buildEvidence } from "./prompt";
import type { ScoreResult } from "./score";

const execFileAsync = promisify(execFile);

/**
 * Grok via the locally-installed CLI.
 *
 * Preferred over the HTTP path because the CLI carries the operator's own
 * session — no XAI_API_KEY to provision, rotate, or leak. `--json-schema`
 * constrains the model, so the CLI returns the object on `structuredOutput`
 * and there is no prose to strip.
 *
 * Returns null (never throws) when the binary is absent or the call fails, so
 * the writer chain falls through to the HTTP client and then the composer.
 */

export const GROK_BIN =
  process.env.GROK_BIN ?? join(homedir(), ".grok", "bin", "grok");

const SCHEMA = {
  type: "object",
  properties: {
    video_script: { type: "string" },
    page_roast: { type: "string" },
    one_liner: { type: "string" },
    tagline: { type: "string" },
    caption_lines: { type: "array", items: { type: "string" } },
  },
  required: ["video_script", "page_roast", "one_liner", "tagline", "caption_lines"],
  additionalProperties: false,
};

export interface GrokCliResult {
  videoScript: string;
  pageRoast: string;
  oneLiner: string;
  tagline: string;
  captionLines: string[];
  model: string;
}

function prompt(evidence: unknown): string {
  return `You are the SlopHunt roast engine — a burnt-out senior reviewer who has read 40,000 pull requests. Dry, tired, devastating, secretly fair. Write a comedy roast of this repository.

HARD RULES, NON-NEGOTIABLE:
- Roast the SOFTWARE, never the person. No jokes about identity, nationality, appearance, gender, or intelligence.
- Every joke must cite a specific item from the crimes list below. No generic filler.
- Never reveal or guess any leaked secret value. Saying one exists is fine.
- If a crime mentions a leaked secret, tell them to rotate it today.

STYLE: This becomes a 9:16 vertical video with fast cuts and a synthetic voice at 1.3x speed. Short punchy sentences. Land a laugh every 3 seconds. No preamble.

video_script: 90-110 words, spoken aloud, cold open, ends by revealing the Slop Score.
caption_lines: the SAME script split into 4-7 word beats for on-screen captions. Every word from video_script must appear, in order.
page_roast: 150-250 words, paragraphs separated by blank lines.
one_liner: under 100 characters, the most brutal line.
tagline: under 80 characters, a Product-Hunt tagline rewritten with contempt.

EVIDENCE:
${JSON.stringify(evidence, null, 2)}`;
}

/** Digs the schema-constrained object out of the CLI's JSON envelope. */
export function parseGrokCliOutput(stdout: string): GrokCliResult | null {
  const candidates: Array<Record<string, unknown>> = [];
  const push = (v: unknown) => {
    if (v && typeof v === "object") candidates.push(v as Record<string, unknown>);
  };

  try {
    const envelope = JSON.parse(stdout) as Record<string, unknown>;
    push(envelope);
    for (const key of ["structuredOutput", "text", "result", "response", "output"]) {
      const inner = envelope[key];
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
    /* not a single JSON doc */
  }

  for (const c of candidates) {
    const str = (v: unknown) =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

    const videoScript = str(c.video_script);
    const pageRoast = str(c.page_roast);
    const oneLiner = str(c.one_liner);
    const tagline = str(c.tagline);
    if (!videoScript || !pageRoast || !oneLiner || !tagline) continue;

    return {
      videoScript,
      pageRoast,
      oneLiner: oneLiner.slice(0, 100),
      tagline: tagline.slice(0, 80),
      captionLines: Array.isArray(c.caption_lines)
        ? (c.caption_lines as unknown[])
            .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
            .map((l) => l.trim())
        : [],
      model: "grok-cli",
    };
  }

  return null;
}

export async function writeRoastWithGrokCli(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): Promise<GrokCliResult | null> {
  if (process.env.GROK_CLI_DISABLED === "true") return null;
  if (!existsSync(GROK_BIN)) return null;

  try {
    const { stdout } = await execFileAsync(
      GROK_BIN,
      [
        "-p",
        prompt(buildEvidence(crawl, score, receipts)),
        "--output-format",
        "json",
        "--json-schema",
        JSON.stringify(SCHEMA),
        "--disable-web-search",
      ],
      { timeout: 180_000, maxBuffer: 12 * 1024 * 1024 },
    );
    return parseGrokCliOutput(stdout);
  } catch {
    return null;
  }
}
