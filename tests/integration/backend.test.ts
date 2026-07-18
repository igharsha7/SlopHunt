import { beforeAll, describe, expect, it } from "vitest";

/**
 * Integration tests against the backend server (npm run server).
 *
 * Set BACKEND_URL to the cloudflared tunnel hostname to exercise the same
 * suite through the public edge — that's how we verify the tunnel actually
 * serves what localhost serves.
 *
 * Auto-skips when nothing is listening so CI stays green without a server.
 */

const BASE = process.env.BACKEND_URL ?? "http://localhost:8787";
let up = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) });
    up = res.ok;
  } catch {
    up = false;
  }
  if (!up) console.warn(`\n[backend] nothing at ${BASE} — skipping. Run: npm run server\n`);
});

const itLive = (name: string, fn: () => Promise<void>) =>
  it(name, async (ctx) => {
    if (!up) return ctx.skip();
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

describe("service health", () => {
  itLive("reports its own configuration honestly", async () => {
    const res = await fetch(`${BASE}/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.service).toBe("slophunt-backend");
    // Never claims read-write without the secret key.
    expect(["read-write", "read-only (no SUPABASE_SECRET_KEY)", "unconfigured"]).toContain(
      body.db,
    );
  });

  itLive("answers /health", async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
  });

  itLive("sends CORS headers so the Vercel frontend can call it", async () => {
    const res = await fetch(`${BASE}/health`, {
      headers: { origin: "https://slophunt.vercel.app" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
  });
});

describe("POST /api/submit — the consent gate", () => {
  itLive("rejects a malformed repo string", async () => {
    const { status, json } = await post("/api/submit", { repo: "not-a-repo" });
    expect(status).toBe(400);
    expect(String(json.error)).toMatch(/owner\/name/i);
  });

  itLive("rejects an empty body", async () => {
    const { status } = await post("/api/submit", {});
    expect(status).toBe(400);
  });

  itLive("refuses a stranger's repo — safety rail 1", async () => {
    const { status, json } = await post("/api/submit", { repo: "vercel/next.js" });
    expect(status).toBe(403);
    expect(String(json.error)).toMatch(/belongs to vercel|roast-me/i);
    expect(json.slug).toBeUndefined();
  });

  itLive("refuses even when a mismatched login is supplied", async () => {
    const { status } = await post("/api/submit", {
      repo: "vercel/next.js",
      login: "someone-else",
    });
    expect(status).toBe(403);
  });

  itLive("404s a repo that does not exist", async () => {
    const { status } = await post("/api/submit", {
      repo: "slophunt-test/definitely-not-real-xyz-999",
      login: "slophunt-test",
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

describe("GET /api/leaderboard", () => {
  itLive("always returns an entries array, even unconfigured", async () => {
    const res = await fetch(`${BASE}/api/leaderboard`);
    const body = (await res.json()) as { entries: unknown[] };
    expect(res.status).toBe(200);
    expect(Array.isArray(body.entries)).toBe(true);
  });
});

describe("GET /api/video/:slug", () => {
  itLive("404s an unknown job rather than inventing a status", async () => {
    const res = await fetch(`${BASE}/api/video/nobody--nothing`);
    expect(res.status).toBe(404);
    expect(((await res.json()) as { status: string }).status).toBe("unknown");
  });
});
