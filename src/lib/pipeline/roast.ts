import "server-only";

import type { Receipt } from "@/lib/slop";
import type { CrawlResult } from "./github";
import { writeRoastWithGrok } from "./grok";
import {
  ROAST_SYSTEM_PROMPT,
  buildEvidence,
  buildUserPrompt,
  parseRoastJson,
} from "./prompt";
import type { ScoreResult } from "./score";

/**
 * Roast writer, in preference order:
 *
 *   1. Grok (XAI_API_KEY)          — primary. Funniest register for dev humour.
 *   2. Claude (ANTHROPIC_API_KEY)  — fallback when Grok is absent or errors.
 *   3. Deterministic composer      — always works, no keys, no network.
 *
 * Every tier obeys the same hard rules and returns the same shape, so the
 * pipeline never blocks on an API and the site is demoable with zero keys.
 */

export interface RoastResult {
  videoScript: string;
  pageRoast: string;
  oneLiner: string;
  tagline: string;
  model: string;
}

const CLAUDE_MODEL = "claude-sonnet-5";

async function claudeRoast(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): Promise<RoastResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const evidence = buildEvidence(crawl, score, receipts);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1600,
        system: ROAST_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(evidence) }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = data.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = parseRoastJson(text);
    return parsed ? { ...parsed, model: CLAUDE_MODEL } : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------- */

const OPENERS = [
  "Let's go through this together, like I did with 40,000 pull requests before it.",
  "I read the whole repository so nobody else has to.",
  "I want to start by saying I believed in software once.",
];

const CLOSERS = [
  "The receipts are below. They were not hard to find.",
  "Everything above is in the commit history. I checked twice.",
  "None of this is invented. That is the saddest part.",
];

export function templateRoast(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): RoastResult {
  const { crimes } = score;
  const name = crawl.meta.name;

  const lines = crimes.map((c) => {
    switch (c.category) {
      case "abandonment":
        return `${c.evidence}. A roadmap is not supposed to be archaeological.`;
      case "commit_poetry":
        return `${c.evidence}. The commit log reads like a hostage note.`;
      case "readme_cope":
        return `${c.evidence}. The gap between that sentence and this repository is where my faith in software went.`;
      case "originality":
        return `${c.evidence}${c.detail ? ` — ${c.detail}` : ""}. You could have just used one of them.`;
      case "vibe_check":
      default:
        return `${c.evidence}.${c.detail ? ` ${c.detail}` : ""}`;
    }
  });

  const seed = name.length + crimes.length;
  const pageRoast = [
    OPENERS[seed % OPENERS.length],
    ...lines.slice(0, 6),
    CLOSERS[seed % CLOSERS.length],
  ].join("\n\n");

  const worst =
    crimes.find((c) => c.category === "abandonment") ??
    crimes.find((c) => c.category === "readme_cope") ??
    crimes[0];
  const oneLiner = worst
    ? worst.evidence.slice(0, 96)
    : `${name} exists, and that is the first problem.`;

  const tagline = receipts[0]
    ? `Like ${receipts[0].name.split("/").pop()}, if it had given up.`
    : crawl.meta.description
      ? `"${crawl.meta.description.slice(0, 60)}" — allegedly.`
      : "A repository that technically exists.";

  const videoScript = [
    `${name}. ${crawl.meta.description ?? "No description. Bold."}`,
    lines[0] ?? "",
    lines[1] ?? "",
    `Slop Score: ${score.slop} out of one hundred. ${
      score.slop >= 75 ? "I need to sit down." : "It could be worse, which is not praise."
    }`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    videoScript,
    pageRoast,
    oneLiner,
    tagline: tagline.slice(0, 80),
    model: "deterministic-composer",
  };
}

export async function writeRoast(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): Promise<RoastResult> {
  const grok = await writeRoastWithGrok(crawl, score, receipts);
  if (grok) return grok;

  const claude = await claudeRoast(crawl, score, receipts);
  if (claude) return claude;

  return templateRoast(crawl, score, receipts);
}
