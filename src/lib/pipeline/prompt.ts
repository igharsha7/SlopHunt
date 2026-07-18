import { CRIME_LABELS, type Receipt } from "@/lib/slop";
import type { CrawlResult } from "./github";
import type { ScoreResult } from "./score";

/**
 * Shared roast contract. Grok and Claude get the identical system prompt and
 * evidence payload, so swapping the writer changes the comedy, never the rules
 * or the output shape.
 */

export const ROAST_SYSTEM_PROMPT = `You are the SlopHunt roast engine — a burnt-out senior reviewer who has read 40,000 pull requests. Dry, tired, devastating, secretly fair. You write comedy roasts of software repositories.

HARD RULES, NON-NEGOTIABLE:
- Roast the SOFTWARE, never the person. No jokes about the author's identity, nationality, appearance, gender, or intelligence.
- Every single joke must cite a specific item from the provided crimes list. No generic filler like "your code is bad" or "this is terrible".
- Never reveal, restate, or guess any leaked secret value. Saying that one exists is fine and encouraged.
- If a crime mentions a leaked secret, tell them to rotate it. Today.
- Punch at the code, not at the coder. The repo is the only target.

Respond with ONLY a JSON object, no markdown fence:
{
  "video_script": "110-130 words, spoken-word pacing, cold open, ends by revealing the Slop Score out loud",
  "page_roast": "150-250 words, receipts woven in, paragraphs separated by \\n\\n",
  "one_liner": "the single most brutal line, under 100 characters",
  "tagline": "Product-Hunt-style tagline rewritten with contempt, under 80 characters"
}`;

export interface RoastEvidence {
  repo: string;
  description: string | null;
  stars: number;
  slop_score: number;
  breakdown: ScoreResult["breakdown"];
  crimes: string[];
  receipts: string[];
}

export function buildEvidence(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): RoastEvidence {
  return {
    repo: `${crawl.meta.owner}/${crawl.meta.name}`,
    description: crawl.meta.description,
    stars: crawl.meta.stars,
    slop_score: score.slop,
    breakdown: score.breakdown,
    crimes: score.crimes.map(
      (c) =>
        `[${CRIME_LABELS[c.category]}] ${c.evidence}${c.detail ? ` (${c.detail})` : ""}`,
    ),
    receipts: receipts.map((r) => `${r.name} — ${r.description} — ${r.url}`),
  };
}

export function buildUserPrompt(evidence: RoastEvidence): string {
  return `Write the roast for this repo. Every joke must cite one of these crimes.\n\n${JSON.stringify(evidence, null, 2)}`;
}

export interface ParsedRoast {
  videoScript: string;
  pageRoast: string;
  oneLiner: string;
  tagline: string;
}

/**
 * Models wrap JSON in prose or fences more often than they should. Slice to the
 * outermost braces, then validate every field is a non-empty string — a
 * half-parsed roast must fall through to the next writer, not ship blank.
 */
export function parseRoastJson(text: string): ParsedRoast | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }

  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

  const videoScript = str(o.video_script);
  const pageRoast = str(o.page_roast);
  const oneLiner = str(o.one_liner);
  const tagline = str(o.tagline);

  if (!videoScript || !pageRoast || !oneLiner || !tagline) return null;

  return {
    videoScript,
    pageRoast,
    oneLiner: oneLiner.slice(0, 100),
    tagline: tagline.slice(0, 80),
  };
}
