import "server-only";

import type { Receipt } from "@/lib/slop";
import type { CrawlResult } from "./github";
import type { ScoreResult } from "./score";
import {
  ROAST_SYSTEM_PROMPT,
  buildEvidence,
  buildUserPrompt,
  parseRoastJson,
  type ParsedRoast,
} from "./prompt";

/**
 * Grok (xAI) — the primary roast writer. Grok's register is closer to the
 * dev-humor voice SlopHunt wants than the safer models, so it gets first pass;
 * Claude and the deterministic composer stand behind it.
 *
 * OpenAI-compatible chat completions API.
 */

const XAI_ENDPOINT = "https://api.x.ai/v1/chat/completions";
export const GROK_MODEL = process.env.GROK_MODEL ?? "grok-4";

export interface GrokResult extends ParsedRoast {
  model: string;
}

export async function writeRoastWithGrok(
  crawl: CrawlResult,
  score: ScoreResult,
  receipts: Receipt[],
): Promise<GrokResult | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const evidence = buildEvidence(crawl, score, receipts);

  try {
    const res = await fetch(XAI_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        // Comedy needs room to be surprising; the rules live in the system
        // prompt, not in a low temperature.
        temperature: 0.9,
        max_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ROAST_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(evidence) },
        ],
      }),
      signal: AbortSignal.timeout(40_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;

    const parsed = parseRoastJson(text);
    if (!parsed) return null;

    return { ...parsed, model: GROK_MODEL };
  } catch {
    return null;
  }
}
