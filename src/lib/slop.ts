/** Shared view model for anything that renders a roasted repo. */

export type CrimeCategory =
  | "originality"
  | "abandonment"
  | "readme_cope"
  | "commit_poetry"
  | "vibe_check";

export interface Crime {
  category: CrimeCategory;
  evidence: string;
  detail?: string;
}

export interface Receipt {
  name: string;
  url: string;
  description: string;
}

export interface Breakdown {
  originality: number;
  abandonment: number;
  readmeCope: number;
  commitPoetry: number;
  vibeCheck: number;
}

export type VideoState = "pending" | "rendering" | "ready" | "failed";

export interface SlopEntry {
  id: string;
  slug: string;
  owner: string;
  name: string;
  htmlUrl: string;
  homepageUrl: string | null;
  tagline: string;
  topics: string[];
  stars: number;
  primaryLang: string | null;
  lastCommit: string | null;
  slopScore: number;
  breakdown: Breakdown;
  skulls: number;
  oneLiner: string;
  pageRoast: string;
  crimes: Crime[];
  receipts: Receipt[];
  video: { status: VideoState; url: string | null };
  screenshotUrl: string | null;
  submittedAt: string;
}

export const CRIME_LABELS: Record<CrimeCategory, string> = {
  originality: "Originality Deficit",
  abandonment: "Abandonment Index",
  readme_cope: "README Cope",
  commit_poetry: "Commit Poetry",
  vibe_check: "Vibe Check",
};

export const BREAKDOWN_LABELS: Array<{ key: keyof Breakdown; label: string; blurb: string }> = [
  {
    key: "originality",
    label: "Originality Deficit",
    blurb: "How many things already do this",
  },
  {
    key: "abandonment",
    label: "Abandonment Index",
    blurb: "Commit recency and decay",
  },
  {
    key: "readmeCope",
    label: "README Cope",
    blurb: "Promise versus reality gap",
  },
  {
    key: "commitPoetry",
    label: "Commit Poetry",
    blurb: "Quality of commit messages",
  },
  {
    key: "vibeCheck",
    label: "Vibe Check",
    blurb: "TODOs, dead code, committed secrets",
  },
];

/**
 * Higher score = sloppier, so the ramp runs green (fine) to orange (crime
 * scene). Text and bar hues differ: text needs contrast on white, bars can run
 * brighter. Yellow is never a text colour on this theme.
 */
export function scoreColor(score: number): string {
  if (score >= 90) return "text-pop";
  if (score >= 75) return "text-rot";
  if (score >= 50) return "text-gold";
  return "text-alive";
}

export function scoreBg(score: number): string {
  if (score >= 90) return "bg-pop";
  if (score >= 75) return "bg-amber";
  if (score >= 50) return "bg-sun";
  return "bg-alive";
}

export function scoreVerdict(score: number): string {
  if (score >= 95) return "BEYOND SAVING";
  if (score >= 90) return "CRIME SCENE";
  if (score >= 80) return "DEEPLY UNWELL";
  if (score >= 70) return "STRUGGLING";
  if (score >= 55) return "MEDIOCRE";
  if (score >= 40) return "SUSPICIOUSLY FINE";
  return "ANNOYINGLY GOOD";
}

/**
 * Category awards, computed on read from whoever currently leads each
 * sub-metric — matches the spec's "computed on read" rule.
 */
export const AWARDS: Array<{
  id: string;
  label: string;
  key: keyof Breakdown;
}> = [
  { id: "most-abandoned", label: "Most Abandoned", key: "abandonment" },
  { id: "most-confident-readme", label: "Most Confident README", key: "readmeCope" },
  { id: "ai-wrapper", label: "AI Wrapper of the Day", key: "originality" },
  { id: "peak-2021", label: "Peak 2021", key: "commitPoetry" },
  { id: "nobody-asked", label: "Solved A Problem Nobody Had", key: "vibeCheck" },
];

export function computeAwards(entries: SlopEntry[]): Map<string, string> {
  const winners = new Map<string, string>();
  for (const award of AWARDS) {
    let best: SlopEntry | null = null;
    for (const entry of entries) {
      if (!best || entry.breakdown[award.key] > best.breakdown[award.key]) {
        best = entry;
      }
    }
    if (best) winners.set(best.id, award.label);
  }
  return winners;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
