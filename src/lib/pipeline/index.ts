import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

import { crawlRepo, fetchRepoMeta, type RepoMeta } from "./github";
import { findReceipts } from "./receipts";
import { computeScore } from "./score";
import { writeRoast } from "./roast";

/**
 * The submission pipeline (spec §4): intake → parallel crawl + receipts →
 * deterministic score → roast → upsert everything. Synchronous by design —
 * the instant path targets under thirty seconds and never waits on video.
 */

export type IntakeResult =
  | { ok: true; meta: RepoMeta }
  | { ok: false; status: number; message: string };

export async function intake(
  owner: string,
  name: string,
  submitterLogin: string | null,
): Promise<IntakeResult> {
  const meta = await fetchRepoMeta(owner, name);
  if (!meta) {
    return {
      ok: false,
      status: 404,
      message:
        "GitHub has never heard of that repo. Check the URL — or is this an early submission for Most Abandoned?",
    };
  }
  if (meta.isPrivate) {
    return {
      ok: false,
      status: 403,
      message: "Private repos stay private. We only roast in public.",
    };
  }

  const hasConsentTopic = meta.topics.includes("roast-me");
  const isOwner =
    !!submitterLogin &&
    meta.ownerLogin.toLowerCase() === submitterLogin.toLowerCase();

  if (!hasConsentTopic && !isOwner) {
    return {
      ok: false,
      status: 403,
      message: submitterLogin
        ? `You're signed in as ${submitterLogin}, but this repo belongs to ${meta.ownerLogin}. Roast your own — or ask them to add the roast-me topic.`
        : "Sign in with GitHub to roast your own repo, or add the roast-me topic to it for consent without an account.",
    };
  }

  return { ok: true, meta };
}

export async function runPipeline(
  meta: RepoMeta,
  submitterId: string | null,
): Promise<{ slug: string }> {
  const db = createAdminClient();
  const slug = `${meta.owner}--${meta.name}`;

  // Repo row first, status crawling — the page can exist before the roast.
  const { data: repoRow, error: repoError } = await db
    .from("repos")
    .upsert(
      {
        owner: meta.owner,
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
        submitted_by: submitterId,
        proof: meta.topics.includes("roast-me")
          ? ("roast_me_topic" as const)
          : ("oauth_owner" as const),
        status: "crawling" as const,
      },
      { onConflict: "owner,name" },
    )
    .select("id")
    .single();

  if (repoError || !repoRow) {
    throw new Error(`repo upsert failed: ${repoError?.message}`);
  }
  const repoId = repoRow.id;

  try {
    // Parallel: crawl + originality receipts (spec: 2a ∥ 2c).
    const [crawl, receipts] = await Promise.all([
      crawlRepo(meta),
      findReceipts(meta),
    ]);

    const score = computeScore(crawl, receipts);
    const roast = await writeRoast(crawl, score, receipts);

    await Promise.all([
      db.from("crawls").upsert({
        repo_id: repoId,
        readme: crawl.readme,
        languages: crawl.languages as Json,
        commits: crawl.commits as unknown as Json,
        file_tree: crawl.topLevelFiles as unknown as Json,
        badge_count: crawl.badgeCount,
        todo_count: crawl.todoCount,
        has_node_modules: crawl.hasNodeModules,
        dead_demo_links: crawl.deadDemoLinks,
        secret_suspected: score.secretSuspected,
      }),
      db.from("scores").upsert({
        repo_id: repoId,
        slop_score: score.slop,
        originality_deficit: score.breakdown.originality,
        abandonment_index: score.breakdown.abandonment,
        readme_cope: score.breakdown.readmeCope,
        commit_poetry: score.breakdown.commitPoetry,
        vibe_check: score.breakdown.vibeCheck,
        crimes: score.crimes as unknown as Json,
      }),
      db.from("roasts").upsert({
        repo_id: repoId,
        video_script: roast.videoScript,
        page_roast: roast.pageRoast,
        one_liner: roast.oneLiner,
        sarcastic_tagline: roast.tagline,
        model: roast.model,
      }),
      db.from("videos").upsert({ repo_id: repoId }),
    ]);

    // Receipts: replace wholesale so re-roasts don't accumulate.
    await db.from("receipts").delete().eq("repo_id", repoId);
    if (receipts.length > 0) {
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

    await db.from("repos").update({ status: "roasted", error: null }).eq("id", repoId);
    return { slug };
  } catch (err) {
    await db
      .from("repos")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message.slice(0, 500) : "unknown",
      })
      .eq("id", repoId);
    throw err;
  }
}
