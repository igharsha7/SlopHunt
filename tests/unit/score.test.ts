import { describe, expect, it } from "vitest";

import { computeScore } from "@/lib/pipeline/score";
import type { CrawlResult, RepoMeta } from "@/lib/pipeline/github";
import type { Receipt } from "@/lib/slop";

/**
 * The Slop Score is the thing users argue with, so it must be deterministic
 * and defensible. These lock the ramps and the evidence contract.
 */

const DAY = 86_400_000;

function meta(over: Partial<RepoMeta> = {}): RepoMeta {
  return {
    owner: "someone",
    name: "a-repo",
    htmlUrl: "https://github.com/someone/a-repo",
    description: "does a thing",
    homepage: null,
    topics: [],
    stars: 10,
    forks: 1,
    openIssues: 0,
    language: "TypeScript",
    pushedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 400 * DAY).toISOString(),
    isPrivate: false,
    ownerLogin: "someone",
    ...over,
  };
}

function crawl(over: Partial<CrawlResult> = {}): CrawlResult {
  return {
    meta: over.meta ?? meta(),
    readme: "# a repo\n\nIt does a thing.",
    commits: [{ sha: "abc1234", message: "Add the thing", date: new Date().toISOString() }],
    languages: { TypeScript: 100 },
    topLevelFiles: ["README.md", "src"],
    badgeCount: 0,
    todoCount: 0,
    comingSoon: false,
    superlatives: [],
    hasNodeModules: false,
    hasEnvFile: false,
    demoLinks: [],
    deadDemoLinks: [],
    ...over,
  };
}

const noReceipts: Receipt[] = [];

describe("computeScore — bounds and shape", () => {
  it("keeps every sub-score and the total within 0-100", () => {
    const worst = computeScore(
      crawl({
        meta: meta({
          pushedAt: new Date(Date.now() - 2000 * DAY).toISOString(),
          openIssues: 900,
        }),
        commits: Array.from({ length: 100 }, (_, i) => ({
          sha: `sha${i}`,
          message: "fix",
          date: new Date(Date.now() - 2000 * DAY).toISOString(),
        })),
        badgeCount: 50,
        todoCount: 500,
        comingSoon: true,
        superlatives: ["blazingly fast", "revolutionary", "10x"],
        hasNodeModules: true,
        hasEnvFile: true,
        deadDemoLinks: ["https://dead.example", "https://also-dead.example"],
      }),
      [
        { name: "a/b", url: "u", description: "d" },
        { name: "c/d", url: "u", description: "d" },
        { name: "e/f", url: "u", description: "d" },
      ],
    );

    for (const value of Object.values(worst.breakdown)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(worst.slop).toBeGreaterThanOrEqual(0);
    expect(worst.slop).toBeLessThanOrEqual(100);
  });

  it("is deterministic — same input, same score", () => {
    const input = crawl();
    const a = computeScore(input, noReceipts);
    const b = computeScore(input, noReceipts);
    expect(a.slop).toBe(b.slop);
    expect(a.breakdown).toEqual(b.breakdown);
  });

  it("averages the five sub-scores", () => {
    const r = computeScore(crawl(), noReceipts);
    const expected = Math.round(
      (r.breakdown.originality +
        r.breakdown.abandonment +
        r.breakdown.readmeCope +
        r.breakdown.commitPoetry +
        r.breakdown.vibeCheck) /
        5,
    );
    expect(r.slop).toBe(expected);
  });

  it("caps the crimes list at 10 so the roast stays readable", () => {
    const r = computeScore(
      crawl({
        badgeCount: 9,
        todoCount: 40,
        comingSoon: true,
        superlatives: ["blazingly fast"],
        hasNodeModules: true,
        hasEnvFile: true,
        deadDemoLinks: ["a", "b", "c", "d", "e", "f"],
        commits: Array.from({ length: 20 }, () => ({
          sha: "x",
          message: "wip",
          date: new Date(Date.now() - 500 * DAY).toISOString(),
        })),
      }),
      [{ name: "a/b", url: "u", description: "d" }],
    );
    expect(r.crimes.length).toBeLessThanOrEqual(10);
  });
});

describe("abandonment index", () => {
  it("scores a repo committed today far below one silent for two years", () => {
    const fresh = computeScore(crawl(), noReceipts);
    const stale = computeScore(
      crawl({
        commits: [
          { sha: "a", message: "final final v2", date: new Date(Date.now() - 730 * DAY).toISOString() },
        ],
      }),
      noReceipts,
    );
    expect(stale.breakdown.abandonment).toBeGreaterThan(
      fresh.breakdown.abandonment + 50,
    );
  });

  it("cites the last commit message when the repo is stale", () => {
    const r = computeScore(
      crawl({
        commits: [
          { sha: "a", message: "final final v2", date: new Date(Date.now() - 400 * DAY).toISOString() },
        ],
      }),
      noReceipts,
    );
    const crime = r.crimes.find((c) => c.category === "abandonment");
    expect(crime?.evidence).toContain("final final v2");
  });
});

describe("commit poetry", () => {
  it("punishes a log of nothing but 'fix'", () => {
    const lazy = computeScore(
      crawl({
        commits: Array.from({ length: 20 }, (_, i) => ({
          sha: `s${i}`,
          message: "fix",
          date: new Date().toISOString(),
        })),
      }),
      noReceipts,
    );
    const thoughtful = computeScore(
      crawl({
        commits: Array.from({ length: 20 }, (_, i) => ({
          sha: `s${i}`,
          message: `Handle stale closure in subscribe teardown (${i})`,
          date: new Date().toISOString(),
        })),
      }),
      noReceipts,
    );
    expect(lazy.breakdown.commitPoetry).toBeGreaterThan(
      thoughtful.breakdown.commitPoetry,
    );
  });

  it("quotes the repeated message as evidence", () => {
    const r = computeScore(
      crawl({
        commits: Array.from({ length: 10 }, () => ({
          sha: "s",
          message: "wip",
          date: new Date().toISOString(),
        })),
      }),
      noReceipts,
    );
    const crime = r.crimes.find((c) => c.category === "commit_poetry");
    expect(crime?.evidence).toContain("wip");
  });
});

describe("vibe check and safety", () => {
  it("flags a committed .env without ever storing its value", () => {
    const r = computeScore(crawl({ hasEnvFile: true }), noReceipts);
    expect(r.secretSuspected).toBe(true);

    const crime = r.crimes.find((c) => c.evidence.includes("leaked secret"));
    expect(crime).toBeDefined();
    // Safety rail 4: we say one exists, never what it is.
    expect(crime?.evidence.toLowerCase()).not.toMatch(/sk-|ghp_|=[a-z0-9]{16}/);
    expect(crime?.detail).toContain("Rotate");
  });

  it("does not set secretSuspected when no env file is present", () => {
    expect(computeScore(crawl(), noReceipts).secretSuspected).toBe(false);
  });

  it("penalises committed node_modules", () => {
    const clean = computeScore(crawl(), noReceipts);
    const dirty = computeScore(crawl({ hasNodeModules: true }), noReceipts);
    expect(dirty.breakdown.vibeCheck).toBeGreaterThan(clean.breakdown.vibeCheck);
  });
});

describe("originality deficit", () => {
  it("rises with the number of receipts found", () => {
    const none = computeScore(crawl(), []);
    const three = computeScore(crawl(), [
      { name: "a/b", url: "u", description: "d" },
      { name: "c/d", url: "u", description: "d" },
      { name: "e/f", url: "u", description: "d" },
    ]);
    expect(three.breakdown.originality).toBeGreaterThan(
      none.breakdown.originality,
    );
  });

  it("names the receipts in the crime detail", () => {
    const r = computeScore(crawl(), [
      { name: "pmndrs/zustand", url: "u", description: "d" },
    ]);
    const crime = r.crimes.find((c) => c.category === "originality");
    expect(crime?.detail).toContain("pmndrs/zustand");
  });
});

describe("readme cope", () => {
  it("charges for badges, superlatives and dead links", () => {
    const plain = computeScore(crawl(), noReceipts);
    const cope = computeScore(
      crawl({
        badgeCount: 6,
        superlatives: ["blazingly fast"],
        comingSoon: true,
        deadDemoLinks: ["https://dead.example"],
      }),
      noReceipts,
    );
    expect(cope.breakdown.readmeCope).toBeGreaterThan(
      plain.breakdown.readmeCope,
    );
  });

  it("reports a dead demo link with its URL", () => {
    const r = computeScore(
      crawl({ deadDemoLinks: ["https://gone.example"] }),
      noReceipts,
    );
    expect(
      r.crimes.some((c) => c.evidence.includes("https://gone.example")),
    ).toBe(true);
  });
});
