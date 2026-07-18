import { afterEach, describe, expect, it, vi } from "vitest";

import { templateRoast, writeRoast } from "@/lib/pipeline/roast";
import { writeRoastWithGrok } from "@/lib/pipeline/grok";
import type { CrawlResult, RepoMeta } from "@/lib/pipeline/github";
import type { ScoreResult } from "@/lib/pipeline/score";

/**
 * Writer chain: Grok → Claude → deterministic composer. The point of these is
 * that no key and no network still yields a shippable roast.
 */

const meta: RepoMeta = {
  owner: "someone",
  name: "abandoned-thing",
  htmlUrl: "https://github.com/someone/abandoned-thing",
  description: "a thing that was abandoned",
  homepage: null,
  topics: [],
  stars: 3,
  forks: 0,
  openIssues: 2,
  language: "JavaScript",
  pushedAt: null,
  createdAt: null,
  isPrivate: false,
  ownerLogin: "someone",
};

const crawl = { meta } as CrawlResult;

const score: ScoreResult = {
  slop: 88,
  breakdown: {
    originality: 90,
    abandonment: 95,
    readmeCope: 80,
    commitPoetry: 88,
    vibeCheck: 87,
  },
  crimes: [
    { category: "abandonment", evidence: 'Last commit: "final final v2" — 18 months ago' },
    { category: "commit_poetry", evidence: '12 of 40 commits are just "fix"' },
    { category: "vibe_check", evidence: "node_modules is committed" },
  ],
  secretSuspected: false,
};

const receipts = [
  { name: "pmndrs/zustand", url: "https://github.com/pmndrs/zustand", description: "1.1kb" },
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("templateRoast — the always-works tier", () => {
  const r = templateRoast(crawl, score, receipts);

  it("fills every field", () => {
    expect(r.videoScript.length).toBeGreaterThan(20);
    expect(r.pageRoast.length).toBeGreaterThan(50);
    expect(r.oneLiner.length).toBeGreaterThan(5);
    expect(r.tagline.length).toBeGreaterThan(5);
    expect(r.model).toBe("deterministic-composer");
  });

  it("respects the field length caps", () => {
    expect(r.oneLiner.length).toBeLessThanOrEqual(100);
    expect(r.tagline.length).toBeLessThanOrEqual(80);
  });

  it("cites real evidence rather than generic snark", () => {
    expect(r.pageRoast).toContain("final final v2");
    expect(r.videoScript).toContain("88");
  });

  it("is deterministic", () => {
    expect(templateRoast(crawl, score, receipts)).toEqual(r);
  });

  it("survives a repo with no crimes and no receipts", () => {
    const bare = templateRoast(
      crawl,
      { ...score, crimes: [] },
      [],
    );
    expect(bare.oneLiner.length).toBeGreaterThan(0);
    expect(bare.tagline.length).toBeGreaterThan(0);
  });
});

describe("writeRoast — the chain", () => {
  it("falls all the way through to the composer with no API keys", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const r = await writeRoast(crawl, score, receipts);
    expect(r.model).toBe("deterministic-composer");
  });

  it("prefers Grok when it answers", async () => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    vi.stubEnv("GROK_MODEL", "grok-4");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  video_script: "Grok wrote this.",
                  page_roast: "Grok roast.",
                  one_liner: "Grok line.",
                  tagline: "Grok tagline.",
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const r = await writeRoast(crawl, score, receipts);
    expect(r.videoScript).toBe("Grok wrote this.");
    expect(r.model).toContain("grok");
  });

  it("falls back to the composer when Grok errors", async () => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream on fire", { status: 500 }),
    );
    const r = await writeRoast(crawl, score, receipts);
    expect(r.model).toBe("deterministic-composer");
  });

  it("falls back when Grok returns unparseable content", async () => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "no json here" } }] }),
        { status: 200 },
      ),
    );
    const r = await writeRoast(crawl, score, receipts);
    expect(r.model).toBe("deterministic-composer");
  });

  it("falls back when the network throws outright", async () => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNRESET"));
    const r = await writeRoast(crawl, score, receipts);
    expect(r.model).toBe("deterministic-composer");
  });
});

describe("writeRoastWithGrok", () => {
  it("returns null without a key, without calling the network", async () => {
    vi.stubEnv("XAI_API_KEY", "");
    const spy = vi.spyOn(globalThis, "fetch");
    expect(await writeRoastWithGrok(crawl, score, receipts)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("posts the evidence and the guardrails to the xAI endpoint", async () => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  video_script: "s",
                  page_roast: "p",
                  one_liner: "o",
                  tagline: "t",
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await writeRoastWithGrok(crawl, score, receipts);

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.x.ai");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");

    const body = JSON.parse(init.body as string);
    expect(body.model).toMatch(/grok/);
    expect(body.messages[0].content).toMatch(/SOFTWARE, never the person/i);
    expect(body.messages[1].content).toContain("final final v2");
  });
});
