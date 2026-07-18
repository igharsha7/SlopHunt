import { describe, expect, it } from "vitest";

import {
  ROAST_SYSTEM_PROMPT,
  buildEvidence,
  buildUserPrompt,
  parseRoastJson,
} from "@/lib/pipeline/prompt";
import type { CrawlResult, RepoMeta } from "@/lib/pipeline/github";
import type { ScoreResult } from "@/lib/pipeline/score";

/**
 * Grok and Claude share this contract. A model that returns prose, a fence, or
 * a half-filled object must fall through to the next writer — never ship blank.
 */

const VALID = JSON.stringify({
  video_script: "A script.",
  page_roast: "Para one.\n\nPara two.",
  one_liner: "The brutal line.",
  tagline: "A contemptuous tagline.",
});

describe("parseRoastJson", () => {
  it("parses a clean JSON object", () => {
    const r = parseRoastJson(VALID);
    expect(r?.videoScript).toBe("A script.");
    expect(r?.pageRoast).toContain("Para two.");
    expect(r?.oneLiner).toBe("The brutal line.");
    expect(r?.tagline).toBe("A contemptuous tagline.");
  });

  it("recovers JSON wrapped in a markdown fence", () => {
    expect(parseRoastJson("```json\n" + VALID + "\n```")).not.toBeNull();
  });

  it("recovers JSON buried in chatty prose", () => {
    const r = parseRoastJson(`Sure! Here's the roast:\n\n${VALID}\n\nHope that helps!`);
    expect(r?.oneLiner).toBe("The brutal line.");
  });

  it("returns null for prose with no JSON at all", () => {
    expect(parseRoastJson("I'd rather not roast this repo.")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseRoastJson('{"video_script": "unterminated')).toBeNull();
  });

  it.each([
    ["video_script", "page_roast"],
    ["page_roast", "one_liner"],
    ["one_liner", "tagline"],
    ["tagline", "video_script"],
  ])("returns null when %s is missing", (missing) => {
    const obj = JSON.parse(VALID) as Record<string, string>;
    delete obj[missing];
    expect(parseRoastJson(JSON.stringify(obj))).toBeNull();
  });

  it("rejects empty and whitespace-only fields rather than shipping blanks", () => {
    const blank = { ...JSON.parse(VALID), one_liner: "   " };
    expect(parseRoastJson(JSON.stringify(blank))).toBeNull();
  });

  it("rejects non-string fields", () => {
    const wrong = { ...JSON.parse(VALID), tagline: 42 };
    expect(parseRoastJson(JSON.stringify(wrong))).toBeNull();
  });

  it("truncates one_liner to 100 and tagline to 80 characters", () => {
    const long = {
      ...JSON.parse(VALID),
      one_liner: "x".repeat(300),
      tagline: "y".repeat(300),
    };
    const r = parseRoastJson(JSON.stringify(long));
    expect(r?.oneLiner).toHaveLength(100);
    expect(r?.tagline).toHaveLength(80);
  });
});

describe("system prompt guardrails", () => {
  it("states the software-not-person rule", () => {
    expect(ROAST_SYSTEM_PROMPT).toMatch(/SOFTWARE, never the person/i);
    expect(ROAST_SYSTEM_PROMPT).toMatch(/identity|nationality|intelligence/i);
  });

  it("requires every joke to cite evidence", () => {
    expect(ROAST_SYSTEM_PROMPT).toMatch(/cite a specific item/i);
  });

  it("forbids restating a leaked secret", () => {
    expect(ROAST_SYSTEM_PROMPT).toMatch(/Never reveal, restate, or guess any leaked secret/i);
  });
});

describe("buildEvidence", () => {
  const meta: RepoMeta = {
    owner: "someone",
    name: "a-repo",
    htmlUrl: "https://github.com/someone/a-repo",
    description: "does a thing",
    homepage: null,
    topics: [],
    stars: 7,
    forks: 0,
    openIssues: 0,
    language: "TypeScript",
    pushedAt: null,
    createdAt: null,
    isPrivate: false,
    ownerLogin: "someone",
  };

  const crawl = { meta } as CrawlResult;
  const score: ScoreResult = {
    slop: 61,
    breakdown: {
      originality: 60,
      abandonment: 61,
      readmeCope: 62,
      commitPoetry: 60,
      vibeCheck: 62,
    },
    crimes: [{ category: "abandonment", evidence: "Last commit was ages ago", detail: "14 months" }],
    secretSuspected: false,
  };

  it("labels crimes and carries the score into the payload", () => {
    const e = buildEvidence(crawl, score, [
      { name: "a/b", url: "https://x", description: "does this too" },
    ]);
    expect(e.repo).toBe("someone/a-repo");
    expect(e.slop_score).toBe(61);
    expect(e.crimes[0]).toContain("Abandonment Index");
    expect(e.crimes[0]).toContain("14 months");
    expect(e.receipts[0]).toContain("a/b");
  });

  it("embeds the evidence in the user prompt as JSON", () => {
    const prompt = buildUserPrompt(buildEvidence(crawl, score, []));
    expect(prompt).toContain("someone/a-repo");
    expect(prompt).toMatch(/must cite/i);
  });
});
