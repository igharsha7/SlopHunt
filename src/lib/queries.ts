import "server-only";

import { DEMO_ENTRIES, findDemoEntry } from "./demo-data";
import type { SlopEntry } from "./slop";

/**
 * Data access for roasted repos.
 *
 * Until the migration is applied and the pipeline starts writing rows, these
 * return the demo fixtures so the whole UI is visible and shippable. Once the
 * DB is live, swap the bodies to read from Supabase — the SlopEntry shape is
 * the contract the components depend on, so nothing above this file changes.
 */

export type LeaderboardRange = "today" | "week" | "all";

export async function getLeaderboard(
  range: LeaderboardRange = "all",
  tag?: string,
): Promise<SlopEntry[]> {
  let entries = [...DEMO_ENTRIES];

  if (range !== "all") {
    const windowDays = range === "today" ? 1 : 7;
    const cutoff = Date.now() - windowDays * 86_400_000;
    entries = entries.filter((e) => new Date(e.submittedAt).getTime() >= cutoff);
  }

  if (tag) {
    entries = entries.filter((e) => e.topics.includes(tag));
  }

  return entries.sort((a, b) => b.slopScore - a.slopScore);
}

export async function getEntry(idOrSlug: string): Promise<SlopEntry | null> {
  return findDemoEntry(decodeURIComponent(idOrSlug)) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  return DEMO_ENTRIES.map((e) => e.slug);
}

export async function getAllTags(): Promise<string[]> {
  const tags = new Set<string>();
  for (const entry of DEMO_ENTRIES) {
    for (const topic of entry.topics) {
      if (topic !== "roast-me") tags.add(topic);
    }
  }
  return [...tags].sort();
}
