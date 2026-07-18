import "server-only";

import type { Receipt } from "@/lib/slop";
import type { RepoMeta } from "./github";

/**
 * Originality agent — finds the 2–3 real repos that already do this, via the
 * GitHub search API. No LLM required: the search terms come from the repo's
 * own description and topics, which is fitting.
 */

function searchTerms(meta: RepoMeta): string {
  const fromDescription = (meta.description ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !["with", "your", "this", "that", "from", "using", "built", "simple", "awesome"].includes(w),
    )
    .slice(0, 4);

  const fromTopics = meta.topics
    .filter((t) => t !== "roast-me")
    .slice(0, 2);

  const terms = [...new Set([...fromDescription, ...fromTopics])];
  return terms.length > 0 ? terms.join(" ") : meta.name.replace(/[-_]/g, " ");
}

export async function findReceipts(meta: RepoMeta): Promise<Receipt[]> {
  const q = `${searchTerms(meta)} stars:>100`;
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "slophunt-crawler",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{
        full_name: string;
        html_url: string;
        description: string | null;
        stargazers_count: number;
      }>;
    };

    return (data.items ?? [])
      .filter(
        (item) =>
          item.full_name.toLowerCase() !==
          `${meta.owner}/${meta.name}`.toLowerCase(),
      )
      .slice(0, 3)
      .map((item) => ({
        name: item.full_name,
        url: item.html_url,
        description: `${(item.description ?? "Does the same thing.").slice(0, 90)} (${item.stargazers_count.toLocaleString()} stars)`,
      }));
  } catch {
    return [];
  }
}
