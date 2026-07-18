import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Roast writer for the backend server.
 *
 *   1. Grok CLI  — local binary, carries the operator's session, no API key.
 *   2. Grok HTTP — XAI_API_KEY, for hosts without the CLI.
 *   3. Composer  — deterministic, always available.
 *
 * Only the CLI returns caption beats, which is what makes the video
 * caption-driven; the other tiers fall back to crime cards.
 */

export const GROK_BIN = process.env.GROK_BIN ?? join(homedir(), ".grok", "bin", "grok");

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

const CRIME_LABELS = {
  originality: "Originality Deficit",
  abandonment: "Abandonment Index",
  readme_cope: "README Cope",
  commit_poetry: "Commit Poetry",
  vibe_check: "Vibe Check",
};

export function buildEvidence(crawl, score, receipts) {
  return {
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
}

export function buildPrompt(evidence) {
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
export function parseGrokOutput(stdout) {
  const candidates = [];
  const push = (v) => {
    if (v && typeof v === "object") candidates.push(v);
  };

  try {
    const envelope = JSON.parse(stdout);
    push(envelope);
    // The CLI puts the schema object on `structuredOutput`, and the same
    // payload as a JSON *string* on `text`.
    for (const key of ["structuredOutput", "text", "result", "response", "output"]) {
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
    /* not a single JSON doc */
  }

  for (const c of candidates) {
    const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
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
        ? c.caption_lines.filter((l) => typeof l === "string" && l.trim()).map((l) => l.trim())
        : [],
      model: "grok-cli",
    };
  }
  return null;
}

async function grokCli(crawl, score, receipts) {
  if (process.env.GROK_CLI_DISABLED === "true" || !existsSync(GROK_BIN)) return null;
  try {
    const { stdout } = await execFileAsync(
      GROK_BIN,
      [
        "-p",
        buildPrompt(buildEvidence(crawl, score, receipts)),
        "--output-format",
        "json",
        "--json-schema",
        JSON.stringify(SCHEMA),
        "--disable-web-search",
      ],
      { timeout: 180_000, maxBuffer: 12 * 1024 * 1024 },
    );
    return parseGrokOutput(stdout);
  } catch {
    return null;
  }
}

async function grokHttp(crawl, score, receipts) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROK_MODEL ?? "grok-4",
        temperature: 0.9,
        max_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Respond with ONLY a JSON object." },
          { role: "user", content: buildPrompt(buildEvidence(crawl, score, receipts)) },
        ],
      }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = parseGrokOutput(data.choices?.[0]?.message?.content ?? "");
    return parsed ? { ...parsed, model: process.env.GROK_MODEL ?? "grok-4" } : null;
  } catch {
    return null;
  }
}

export function templateRoast(crawl, score, receipts) {
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
      default:
        return `${c.evidence}.${c.detail ? ` ${c.detail}` : ""}`;
    }
  });

  const worst =
    crimes.find((c) => c.category === "abandonment") ??
    crimes.find((c) => c.category === "readme_cope") ??
    crimes[0];

  return {
    videoScript: [
      `${name}. ${crawl.meta.description ?? "No description. Bold."}`,
      lines[0] ?? "",
      lines[1] ?? "",
      `Slop Score: ${score.slop} out of one hundred.`,
    ]
      .filter(Boolean)
      .join(" "),
    pageRoast: ["I read the whole repository so nobody else has to.", ...lines.slice(0, 6)].join(
      "\n\n",
    ),
    oneLiner: worst ? worst.evidence.slice(0, 96) : `${name} exists, and that is the first problem.`,
    tagline: (receipts[0]
      ? `Like ${receipts[0].name.split("/").pop()}, if it had given up.`
      : "A repository that technically exists."
    ).slice(0, 80),
    captionLines: [],
    model: "deterministic-composer",
  };
}

export async function writeRoast(crawl, score, receipts) {
  return (
    (await grokCli(crawl, score, receipts)) ??
    (await grokHttp(crawl, score, receipts)) ??
    templateRoast(crawl, score, receipts)
  );
}
