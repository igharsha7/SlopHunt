import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SlopEntry } from "@/lib/slop";

/**
 * Video agent — HyperFrames.
 *
 * Generates a 9:16 composition from the roast data and renders it out of band.
 * NEVER blocks the instant path (spec §4): the product page ships with the
 * score and text roast, this flips `videos.status` to `ready` when the MP4
 * lands. Set MOCK_VIDEO=true to skip the render entirely in dev.
 */

const PROJECT_DIR = join(process.cwd(), "video", "roast-video");
const GENERATOR = join(process.cwd(), "video", "generate-composition.mjs");

export interface VideoPayload {
  owner: string;
  name: string;
  slopScore: number;
  oneLiner: string;
  crimes: Array<{ evidence: string }>;
}

export function toVideoPayload(entry: SlopEntry): VideoPayload {
  return {
    owner: entry.owner,
    name: entry.name,
    slopScore: entry.slopScore,
    oneLiner: entry.oneLiner,
    crimes: entry.crimes.map((c) => ({ evidence: c.evidence })),
  };
}

function run(cmd: string, args: string[], cwd: string, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "ignore" });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${cmd} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} exited ${code}`));
      }
    });
  });
}

/**
 * Renders the roast video and uploads it to the `roasts` storage bucket.
 * Resolves to the public URL, or null when rendering is unavailable — the
 * caller marks the job failed and the page keeps its placeholder.
 */
export async function renderRoastVideo(
  repoId: string,
  payload: VideoPayload,
): Promise<string | null> {
  const db = createAdminClient();
  await db
    .from("videos")
    .upsert({ repo_id: repoId, status: "rendering", error: null });

  if (process.env.MOCK_VIDEO === "true") {
    await db
      .from("videos")
      .update({ status: "failed", error: "MOCK_VIDEO enabled" })
      .eq("repo_id", repoId);
    return null;
  }

  try {
    const scratch = await mkdtemp(join(tmpdir(), "slophunt-video-"));
    const payloadPath = join(scratch, "payload.json");
    await writeFile(payloadPath, JSON.stringify(payload));

    // Composition first — deterministic, fast, and validated by the renderer.
    await run("node", [GENERATOR, payloadPath, PROJECT_DIR], process.cwd(), 30_000);

    const outPath = join(PROJECT_DIR, "renders", `${repoId}.mp4`);
    await run(
      "npx",
      ["--yes", "hyperframes@0.7.63", "render", "-o", outPath, "--strict"],
      PROJECT_DIR,
      10 * 60_000,
    );

    const mp4 = await readFile(outPath);
    const objectPath = `${repoId}.mp4`;

    const { error: uploadError } = await db.storage
      .from("roasts")
      .upload(objectPath, mp4, { contentType: "video/mp4", upsert: true });
    if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = db.storage.from("roasts").getPublicUrl(objectPath);

    await db
      .from("videos")
      .update({ status: "ready", video_url: publicUrl, error: null })
      .eq("repo_id", repoId);

    return publicUrl;
  } catch (err) {
    await db
      .from("videos")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message.slice(0, 500) : "render failed",
      })
      .eq("repo_id", repoId);
    return null;
  }
}
