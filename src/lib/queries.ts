import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CrawlRow,
  ReceiptRow,
  RepoRow,
  RoastRow,
  ScoreRow,
  VideoRow,
} from "@/lib/supabase/types";

import type { Crime, SlopEntry } from "./slop";

/**
 * Live reads against Supabase. RLS allows public SELECT on everything the
 * leaderboard shows; only roasted repos surface. If the schema hasn't been
 * migrated yet the queries fail with PGRST205 — we surface honest empty
 * states rather than a 500, so the site is deployable before the database.
 */

type RepoJoined = RepoRow & {
  scores: ScoreRow | null;
  roasts: RoastRow | null;
  receipts: ReceiptRow[];
  videos: VideoRow | null;
  crawls: Pick<CrawlRow, "screenshot_url"> | null;
};

const SELECT = `*,
  scores(*),
  roasts(*),
  receipts(*),
  videos(*),
  crawls(screenshot_url)`;

function toEntry(row: RepoJoined): SlopEntry | null {
  const score = row.scores;
  const roast = row.roasts;
  if (!score || !roast) return null;

  return {
    id: row.id,
    slug: `${row.owner}--${row.name}`,
    owner: row.owner,
    name: row.name,
    htmlUrl: row.html_url,
    homepageUrl: row.homepage_url,
    tagline: roast.sarcastic_tagline,
    topics: row.topics,
    stars: row.stars,
    primaryLang: row.primary_lang,
    lastCommit: row.pushed_at,
    slopScore: score.slop_score,
    breakdown: {
      originality: score.originality_deficit,
      abandonment: score.abandonment_index,
      readmeCope: score.readme_cope,
      commitPoetry: score.commit_poetry,
      vibeCheck: score.vibe_check,
    },
    skulls: row.skull_count,
    oneLiner: roast.one_liner,
    pageRoast: roast.page_roast,
    crimes: (Array.isArray(score.crimes) ? score.crimes : []) as unknown as Crime[],
    receipts: [...row.receipts]
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        name: r.name,
        url: r.url,
        description: r.description ?? "",
      })),
    video: {
      status: row.videos?.status ?? "pending",
      url: row.videos?.video_url ?? null,
    },
    screenshotUrl: row.crawls?.screenshot_url ?? null,
    submittedAt: row.created_at,
  };
}

export type LeaderboardRange = "today" | "week" | "all";

export async function getLeaderboard(
  range: LeaderboardRange = "all",
  tag?: string,
): Promise<SlopEntry[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("repos").select(SELECT).eq("status", "roasted");

    if (range !== "all") {
      const windowDays = range === "today" ? 1 : 7;
      const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      query = query.gte("created_at", cutoff);
    }
    if (tag) {
      query = query.contains("topics", [tag]);
    }

    const { data, error } = await query.limit(200);
    if (error || !data) return [];

    return (data as unknown as RepoJoined[])
      .map(toEntry)
      .filter((e): e is SlopEntry => e !== null)
      .sort((a, b) => b.slopScore - a.slopScore);
  } catch {
    return [];
  }
}

export async function getEntry(idOrSlug: string): Promise<SlopEntry | null> {
  try {
    const supabase = await createClient();
    const decoded = decodeURIComponent(idOrSlug);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      decoded,
    );

    let query = supabase.from("repos").select(SELECT);
    if (isUuid) {
      query = query.eq("id", decoded);
    } else {
      const sep = decoded.indexOf("--");
      if (sep === -1) return null;
      query = query
        .eq("owner", decoded.slice(0, sep))
        .eq("name", decoded.slice(sep + 2));
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return toEntry(data as unknown as RepoJoined);
  } catch {
    return null;
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("repos")
      .select("topics")
      .eq("status", "roasted")
      .limit(500);
    if (error || !data) return [];

    const tags = new Set<string>();
    for (const row of data as Array<Pick<RepoRow, "topics">>) {
      for (const topic of row.topics) {
        if (topic !== "roast-me") tags.add(topic);
      }
    }
    return [...tags].sort();
  } catch {
    return [];
  }
}
