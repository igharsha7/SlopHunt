import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { crawlRepo, fetchRepoMeta, findReceipts } from "./github.js";
import { computeScore } from "./score.js";
import { writeRoast } from "./roast.js";

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

/* ------------------------------------------------------------------- env */
for (const file of [".env.local", ".env"]) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const PORT = Number(process.env.PORT ?? 8787);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Writes need the secret key (RLS bypass). Reads work with the publishable
 * key. We surface which mode we're in rather than failing opaquely later.
 */
// `||` not `??` — unset keys arrive from .env as empty strings, which are not
// nullish, so `??` would hand an empty key to createClient and throw.
const db = SUPABASE_URL && SECRET_KEY ? createClient(SUPABASE_URL, SECRET_KEY) : null;
const readDb =
  SUPABASE_URL && (SECRET_KEY || PUBLISHABLE)
    ? createClient(SUPABASE_URL, SECRET_KEY || PUBLISHABLE)
    : null;

/* ---------------------------------------------------------------- render */
/**
 * In-process job queue. Renders need Chrome + ffmpeg, so they run here on a
 * real machine rather than on an edge runtime — this is exactly why the
 * backend is tunnelled instead of deployed to Workers.
 */
const jobs = new Map(); // slug -> { status, videoUrl, error, startedAt }

async function renderVideo(slug, payload) {
  jobs.set(slug, { status: "rendering", startedAt: Date.now() });

  try {
    const scratch = await mkdtemp(join(tmpdir(), "slophunt-"));

    // 1. Voiceover (Kokoro, local, 1.3x)
    let audio = null;
    if (payload.videoScript && process.env.SKIP_TTS !== "true") {
      const wav = join(scratch, "vo.wav");
      const { stdout } = await execFileAsync(
        "node",
        [join(ROOT, "scripts", "kokoro-tts.mjs"), "--text", payload.videoScript, wav],
        { timeout: 10 * 60_000, maxBuffer: 8 * 1024 * 1024 },
      );
      const meta = JSON.parse(stdout.trim().split("\n").pop());
      audio = { path: wav, duration: meta.durationSec };
    }

    // 2. Composition
    const payloadPath = join(scratch, "payload.json");
    await writeFile(payloadPath, JSON.stringify({ ...payload, audio }));
    const projectDir = join(ROOT, "video", "roast-video");
    await execFileAsync(
      "node",
      [join(ROOT, "video", "generate-composition.mjs"), payloadPath, projectDir],
      { timeout: 60_000 },
    );

    // 3. Render — TMPDIR on the big volume; the system disk fills fast.
    const out = join(projectDir, "renders", `${slug}.mp4`);
    await execFileAsync(
      "npx",
      ["--yes", "hyperframes@0.7.63", "render", "-o", out, "--strict"],
      {
        cwd: projectDir,
        timeout: 15 * 60_000,
        env: { ...process.env, TMPDIR: process.env.RENDER_TMPDIR ?? tmpdir() },
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    // 4. Upload (best effort — the MP4 is on disk regardless)
    let videoUrl = `/renders/${slug}.mp4`;
    if (db) {
      const mp4 = await readFile(out);
      const object = `${slug}.mp4`;
      const { error } = await db.storage
        .from("roasts")
        .upload(object, mp4, { contentType: "video/mp4", upsert: true });
      if (!error) {
        videoUrl = db.storage.from("roasts").getPublicUrl(object).data.publicUrl;
      }
      await db.from("videos").upsert({
        repo_id: payload.repoId,
        status: "ready",
        video_url: videoUrl,
      });
    }

    jobs.set(slug, { status: "ready", videoUrl });
    return videoUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 400) : "render failed";
    jobs.set(slug, { status: "failed", error: message });
    if (db) {
      await db
        .from("videos")
        .upsert({ repo_id: payload.repoId, status: "failed", error: message });
    }
    return null;
  }
}

/* ------------------------------------------------------------------- app */
const app = new Hono();

app.use(
  "*",
  cors({
    origin: (o) => o ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type", "authorization"],
  }),
);

app.get("/", (c) =>
  c.json({
    service: "slophunt-backend",
    ok: true,
    db: db ? "read-write" : readDb ? "read-only (no SUPABASE_SECRET_KEY)" : "unconfigured",
    grokCli: existsSync(process.env.GROK_BIN ?? join(process.env.HOME ?? "", ".grok/bin/grok")),
    jobs: jobs.size,
  }),
);

app.get("/health", (c) => c.json({ ok: true, uptime: process.uptime() }));

/** The full instant path: intake gate -> crawl + receipts -> score -> roast. */
app.post("/api/submit", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const match = String(body.repo ?? "").trim().match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!match) {
    return c.json({ error: "Send { repo: 'owner/name' }." }, 400);
  }
  const [, owner, name] = match;
  const login = body.login ?? null;
  const token = process.env.GITHUB_TOKEN;

  const meta = await fetchRepoMeta(owner, name, token);
  if (!meta) return c.json({ error: "GitHub has never heard of that repo." }, 404);
  if (meta.isPrivate) {
    return c.json({ error: "Private repos stay private. We only roast in public." }, 403);
  }

  // Safety rail 1: consent is required, always.
  const consented =
    meta.topics.includes("roast-me") ||
    (login && meta.ownerLogin.toLowerCase() === String(login).toLowerCase());
  if (!consented) {
    return c.json(
      {
        error: `This repo belongs to ${meta.ownerLogin}. Roast your own, or ask them to add the roast-me topic.`,
      },
      403,
    );
  }

  const [crawl, receipts] = await Promise.all([
    crawlRepo(meta, token),
    findReceipts(meta, token),
  ]);
  const score = computeScore(crawl, receipts);
  const roast = await writeRoast(crawl, score, receipts);
  const slug = `${owner}--${name}`;

  let repoId = null;
  let persistError = null;
  if (db) {
    // Attribution first. The schema enforces `proof = 'oauth_owner' =>
    // submitted_by is not null`, because the delete button is gated on the
    // submitter — an unattributed oauth submission would be undeletable.
    let submittedBy = null;
    const byTopic = meta.topics.includes("roast-me");

    if (login && !byTopic) {
      const ghUser = await fetch(`https://api.github.com/users/${login}`, {
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "slophunt-worker",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (ghUser?.id) {
        const { data: userRow } = await db
          .from("users")
          .upsert(
            {
              github_id: ghUser.id,
              github_login: ghUser.login,
              avatar_url: ghUser.avatar_url ?? null,
            },
            { onConflict: "github_id" },
          )
          .select("id")
          .single();
        submittedBy = userRow?.id ?? null;
      }
    }

    // Without a resolved user the only honest proof left is the topic.
    const proof = submittedBy ? "oauth_owner" : "roast_me_topic";

    const { data, error } = await db
      .from("repos")
      .upsert(
        {
          owner,
          name: meta.name,
          html_url: meta.htmlUrl,
          homepage_url: meta.homepage,
          description: meta.description,
          topics: meta.topics,
          stars: meta.stars,
          forks: meta.forks,
          open_issues: meta.openIssues,
          primary_lang: meta.language,
          pushed_at: meta.pushedAt,
          submitted_by: submittedBy,
          proof,
          status: "roasted",
        },
        { onConflict: "owner,name" },
      )
      .select("id")
      .single();

    // Surface it. A silently swallowed write error looks like "persisted:
    // false" with no cause, which cost real debugging time.
    if (error) {
      persistError = error.message;
      console.error("[submit] repos upsert failed:", error.message);
    }
    repoId = data?.id ?? null;

    if (repoId) {
      await Promise.all([
        db.from("scores").upsert({
          repo_id: repoId,
          slop_score: score.slop,
          originality_deficit: score.breakdown.originality,
          abandonment_index: score.breakdown.abandonment,
          readme_cope: score.breakdown.readmeCope,
          commit_poetry: score.breakdown.commitPoetry,
          vibe_check: score.breakdown.vibeCheck,
          crimes: score.crimes,
        }),
        db.from("roasts").upsert({
          repo_id: repoId,
          video_script: roast.videoScript,
          page_roast: roast.pageRoast,
          one_liner: roast.oneLiner,
          sarcastic_tagline: roast.tagline,
          model: roast.model,
        }),
        db.from("crawls").upsert({
          repo_id: repoId,
          readme: crawl.readme,
          languages: crawl.languages,
          commits: crawl.commits,
          file_tree: crawl.topLevelFiles,
          badge_count: crawl.badgeCount,
          todo_count: crawl.todoCount,
          has_node_modules: crawl.hasNodeModules,
          dead_demo_links: crawl.deadDemoLinks,
          secret_suspected: score.secretSuspected,
        }),
        db.from("videos").upsert({ repo_id: repoId, status: "pending" }),
      ]);

      await db.from("receipts").delete().eq("repo_id", repoId);
      if (receipts.length) {
        await db.from("receipts").insert(
          receipts.map((r, i) => ({
            repo_id: repoId,
            name: r.name,
            url: r.url,
            description: r.description,
            position: i,
          })),
        );
      }
    }
  }

  // Video is fire-and-forget: the instant path never waits on it.
  if (body.video !== false) {
    void renderVideo(slug, {
      repoId,
      owner,
      name: meta.name,
      slopScore: score.slop,
      oneLiner: roast.oneLiner,
      videoScript: roast.videoScript,
      captionLines: roast.captionLines ?? [],
      crimes: score.crimes,
    });
  }

  return c.json({
    slug,
    slopScore: score.slop,
    breakdown: score.breakdown,
    crimes: score.crimes,
    receipts,
    roast: {
      oneLiner: roast.oneLiner,
      tagline: roast.tagline,
      pageRoast: roast.pageRoast,
      model: roast.model,
    },
    persisted: Boolean(repoId),
    ...(persistError ? { persistError } : {}),
    video: { status: "rendering", poll: `/api/video/${slug}` },
  });
});

app.get("/api/video/:slug", (c) => {
  const job = jobs.get(c.req.param("slug"));
  if (!job) return c.json({ status: "unknown" }, 404);
  return c.json(job);
});

/**
 * Serves rendered MP4s straight off disk. Supabase Storage is the durable
 * home, but this makes the video viewable the instant the render finishes —
 * and keeps the demo working if the upload fails.
 */
app.get("/renders/:file", async (c) => {
  const file = c.req.param("file");
  // Path traversal guard: only a bare slug.mp4 is ever addressable.
  if (!/^[\w.-]+\.mp4$/.test(file)) return c.text("bad name", 400);

  const path = join(ROOT, "video", "roast-video", "renders", file);
  if (!existsSync(path)) return c.text("not found", 404);

  const mp4 = await readFile(path);
  return new Response(mp4, {
    headers: {
      "content-type": "video/mp4",
      "content-length": String(mp4.length),
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
});

app.post("/api/react", async (c) => {
  const { entryId, fingerprint, on } = await c.req.json().catch(() => ({}));
  if (!entryId || !fingerprint || typeof on !== "boolean") {
    return c.json({ error: "entryId, fingerprint, on required" }, 400);
  }
  if (String(fingerprint).length > 64) return c.json({ error: "fingerprint too long" }, 400);
  if (!db) return c.json({ error: "reactions need SUPABASE_SECRET_KEY" }, 503);

  if (on) {
    await db
      .from("reactions")
      .upsert({ repo_id: entryId, fingerprint }, { onConflict: "repo_id,fingerprint", ignoreDuplicates: true });
  } else {
    await db.from("reactions").delete().eq("repo_id", entryId).eq("fingerprint", fingerprint);
  }
  const { count } = await db
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("repo_id", entryId);
  const skulls = count ?? 0;
  await db.from("repos").update({ skull_count: skulls }).eq("id", entryId);
  return c.json({ skulls });
});

app.get("/api/leaderboard", async (c) => {
  if (!readDb) return c.json({ entries: [], error: "database unconfigured" });
  const { data, error } = await readDb
    .from("repos")
    .select("*, scores(*), roasts(*), receipts(*), videos(*)")
    .eq("status", "roasted")
    .limit(200);
  if (error) return c.json({ entries: [], error: error.message });
  const entries = (data ?? [])
    .filter((r) => r.scores && r.roasts)
    .sort((a, b) => b.scores.slop_score - a.scores.slop_score);
  return c.json({ entries });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`slophunt backend on http://localhost:${info.port}`);
  console.log(`  db:      ${db ? "read-write" : readDb ? "read-only" : "unconfigured"}`);
  console.log(`  grok:    ${existsSync(GROK_BIN_PATH()) ? "cli available" : "cli missing"}`);
});

function GROK_BIN_PATH() {
  return process.env.GROK_BIN ?? join(process.env.HOME ?? "", ".grok", "bin", "grok");
}

export { app, renderVideo, jobs };
