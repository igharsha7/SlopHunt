import { describe, expect, it } from "vitest";

// The server copy is plain JS with no .d.ts; the shapes are asserted below.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parseGrokOutput, templateRoast, buildEvidence, buildPrompt } from "../../server/src/roast.js";

/**
 * The backend server carries its own copy of the roast chain (plain JS so it
 * runs under bare Node with no build step). These lock the same guarantees the
 * Next-side tests cover, so the two copies cannot silently diverge.
 */

const ROAST = {
  video_script: "Three stars. Four days old.",
  page_roast: "Para one.\n\nPara two.",
  one_liner: "Already a cover band.",
  tagline: "Product Hunt for leftovers.",
  caption_lines: ["Three stars.", "Already a cover band."],
};

const crawl = {
  meta: {
    owner: "someone",
    name: "a-repo",
    description: "does a thing",
    stars: 3,
    ownerLogin: "someone",
  },
};

const score = {
  slop: 71,
  breakdown: { originality: 70, abandonment: 72, readmeCope: 70, commitPoetry: 71, vibeCheck: 72 },
  crimes: [
    { category: "abandonment", evidence: 'Last commit: "final final v2" — 18 months ago' },
    { category: "vibe_check", evidence: "node_modules is committed" },
  ],
  secretSuspected: false,
};

const receipts = [{ name: "pmndrs/zustand", url: "https://x", description: "1.1kb" }];

describe("server parseGrokOutput", () => {
  it("reads structuredOutput off the CLI envelope", () => {
    const r = parseGrokOutput(
      JSON.stringify({ text: JSON.stringify(ROAST), structuredOutput: ROAST }),
    )!;
    expect(r.oneLiner).toBe("Already a cover band.");
    expect(r.captionLines).toHaveLength(2);
    expect(r.model).toBe("grok-cli");
  });

  it("falls back to the JSON string on text", () => {
    const r = parseGrokOutput(JSON.stringify({ text: JSON.stringify(ROAST) }))!;
    expect(r.videoScript).toBe("Three stars. Four days old.");
  });

  it("returns null on prose and on garbage", () => {
    expect(parseGrokOutput(JSON.stringify({ text: "no thanks" }))).toBeNull();
    expect(parseGrokOutput("command not found")).toBeNull();
  });

  it("rejects a partial roast rather than shipping blanks", () => {
    const partial = { ...ROAST, tagline: "  " };
    expect(parseGrokOutput(JSON.stringify({ structuredOutput: partial }))).toBeNull();
  });

  it("enforces the length caps", () => {
    const long = { ...ROAST, one_liner: "x".repeat(200), tagline: "y".repeat(200) };
    const r = parseGrokOutput(JSON.stringify({ structuredOutput: long }))!;
    expect(r.oneLiner).toHaveLength(100);
    expect(r.tagline).toHaveLength(80);
  });
});

describe("server templateRoast", () => {
  it("fills every field with no keys and no network", () => {
    const r = templateRoast(crawl, score, receipts);
    expect(r.model).toBe("deterministic-composer");
    expect(r.videoScript.length).toBeGreaterThan(20);
    expect(r.pageRoast.length).toBeGreaterThan(40);
    expect(r.oneLiner.length).toBeGreaterThan(5);
    expect(r.tagline.length).toBeLessThanOrEqual(80);
  });

  it("cites real evidence and the score", () => {
    const r = templateRoast(crawl, score, receipts);
    expect(r.pageRoast).toContain("final final v2");
    expect(r.videoScript).toContain("71");
  });

  it("survives zero crimes and zero receipts", () => {
    const r = templateRoast(crawl, { ...score, crimes: [] }, []);
    expect(r.oneLiner.length).toBeGreaterThan(0);
    expect(r.tagline.length).toBeGreaterThan(0);
  });
});

describe("server prompt contract", () => {
  it("labels crimes and carries receipts into the evidence", () => {
    const e = buildEvidence(crawl, score, receipts);
    expect(e.repo).toBe("someone/a-repo");
    expect(e.slop_score).toBe(71);
    expect(e.crimes[0]).toContain("Abandonment Index");
    expect(e.receipts[0]).toContain("pmndrs/zustand");
  });

  it("keeps the guardrails in the prompt sent to Grok", () => {
    const p = buildPrompt(buildEvidence(crawl, score, receipts));
    expect(p).toMatch(/SOFTWARE, never the person/i);
    expect(p).toMatch(/must cite a specific item/i);
    expect(p).toMatch(/Never reveal or guess any leaked secret/i);
    expect(p).toContain("final final v2");
  });
});
