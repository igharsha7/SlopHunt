import "server-only";

import { CRIME_LABELS, type Receipt } from "@/lib/slop";
import type { CrawlResult } from "./github";
import type { ScoreResult } from "./score";

/**
 * Roast writer. With ANTHROPIC_API_KEY set, Deepak is played by Claude under
 * the hard rules (evidence-only, software-never-person). Without it, a
 * deterministic composer stitches the crimes into a serviceable roast so the
 * pipeline stays fully functional — the LLM upgrades the jokes, it is not a
 * dependency.
 */

export interface RoastResult {
  videoScript: string;
  pageRoast: string;
  oneLiner: string;
  tagline: string;
  model: string;
}

const SYSTEM_PROMPT = `You are "Deepak from Code Review" — a burnt-out senior engineer who has reviewed 40,000 pull requests. Dry, tired, devastating, secretly fair. You write comedy roasts of software repositories.

HARD RULES, NON-NEGOTIABLE:
- Roast the SOFTWARE, never the person. No jokes about the author's identity, nationality, appearance, or intelligence.
- Every single joke must cite a specific item from the provided crimes list. No generic filler like "your code is bad".
- Never reveal or restate any leaked secret value. Referring to the fact that one exists is fine.
- If a crime mentions a leaked secret, tell them to rotate it. Today.

Respond with ONLY a JSON object: {"video_script": "~110-130 words, spoken-word pacing, cold open, ends revealing the Slop Score", "page_roast": "150-250 words, receipts woven in, paragraphs separated by \\n\\n", "one_liner": "the most brutal line, under 100 chars", "tagline": "Product-Hunt-style tagline rewritten with contempt, under 80 chars"}`;

async function claudeRoast(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): Promise<RoastResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = "claude-sonnet-5";
  const evidence = {
    repo: `${crawl.meta.owner}/${crawl.meta.name}`,
    description: crawl.meta.description,
    stars: crawl.meta.stars,
    slop_score: score.slop,
    breakdown: score.breakdown,
    crimes: score.crimes.map(
      (c) => `[${CRIME_LABELS[c.category]}] ${c.evidence}${c.detail ? ` (${c.detail})` : ""}`,
    ),
    receipts: receipts.map((r) => `${r.name} — ${r.description} — ${r.url}`),
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Write the roast for this repo. Evidence:\n${JSON.stringify(evidence, null, 2)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = data.content.find((b) => b.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      video_script: string;
      page_roast: string;
      one_liner: string;
      tagline: string;
    };
    return {
      videoScript: json.video_script,
      pageRoast: json.page_roast,
      oneLiner: json.one_liner.slice(0, 100),
      tagline: json.tagline.slice(0, 80),
      model,
    };
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

function templateRoast(
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
    `Slop Score: ${score.slop} out of one hundred. ${score.slop >= 75 ? "I need to sit down." : "It could be worse, which is not praise."}`,
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
  return (
    (await claudeRoast(crawl, score, receipts)) ??
    templateRoast(crawl, score, receipts)
  );
}
