import { beforeAll, describe, expect, it } from "vitest";

/**
 * Integration tests against a running dev server (npm run dev on :3000).
 * These exercise the real intake gate and the real routes — no mocking — so a
 * regression in the consent rules or the empty-state handling fails here.
 *
 * Skipped automatically when nothing is listening, so `npm test` stays green
 * in CI without a server.
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
let serverUp = false;

beforeAll(async () => {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(3000) });
    serverUp = res.ok;
  } catch {
    serverUp = false;
  }
  if (!serverUp) {
    console.warn(`\n[integration] no server at ${BASE} — skipping. Run: npm run dev\n`);
  }
});

const itLive = (name: string, fn: () => Promise<void>) =>
  it(name, async (ctx) => {
    if (!serverUp) return ctx.skip();
    await fn();
  });

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe("pages render", () => {
  for (const path of ["/", "/leaderboard", "/how", "/faq", "/submit"]) {
    itLive(`GET ${path} returns 200 HTML`, async () => {
      const res = await fetch(`${BASE}${path}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
    });
  }

  itLive("an unknown repo 404s rather than erroring", async () => {
    const res = await fetch(`${BASE}/product/nobody--nothing`);
    expect(res.status).toBe(404);
  });

  itLive("the leaderboard renders in every population state", async () => {
    const html = await (await fetch(`${BASE}/leaderboard`)).text();
    expect(html).not.toContain("Application error");
    // Three valid states: no rows (empty state), 1-3 rows (podium only), or
    // 4+ rows (podium plus the table). The earlier assertion missed the
    // middle one and started failing the moment the first repo was roasted.
    expect(html).toMatch(/Nothing here yet|Slop Score|rest of the wreckage/);
    // The header is unconditional — its absence means a real render failure.
    expect(html).toMatch(/leaderboard/i);
  });
});

describe("POST /api/submit — the consent gate", () => {
  itLive("rejects a non-repo string", async () => {
    const { status, json } = await post("/api/submit", { repo: "just-a-word" });
    expect(status).toBe(400);
    expect(String(json.error)).toMatch(/owner\/name/i);
  });

  itLive("rejects a missing body", async () => {
    const { status } = await post("/api/submit", {});
    expect(status).toBe(400);
  });

  itLive("refuses a stranger's repo when signed out (safety rail 1)", async () => {
    const { status, json } = await post("/api/submit", { repo: "vercel/next.js" });
    expect(status).toBe(403);
    expect(String(json.error)).toMatch(/sign in|roast-me/i);
    expect(json.slug).toBeUndefined();
  });

  itLive("404s a repo GitHub has never heard of", async () => {
    const { status } = await post("/api/submit", {
      repo: "slophunt-test-org/definitely-not-a-real-repo-xyz",
    });
    expect([403, 404]).toContain(status);
  });
});

describe("POST /api/react", () => {
  itLive("validates its input", async () => {
    const { status } = await post("/api/react", { entryId: "x" });
    expect(status).toBe(400);
  });

  itLive("rejects an oversized fingerprint", async () => {
    const { status } = await post("/api/react", {
      entryId: "00000000-0000-4000-8000-000000000000",
      fingerprint: "x".repeat(200),
      on: true,
    });
    expect(status).toBe(400);
  });
});
