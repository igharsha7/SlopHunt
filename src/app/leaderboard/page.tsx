import type { Metadata } from "next";
import Link from "next/link";

import { Reveal, RevealGroup } from "@/components/gsap/reveal";
import { FilterTabs } from "@/components/leaderboard/filter-tabs";
import { SlopRow } from "@/components/slop/slop-row";
import { getAllTags, getLeaderboard, type LeaderboardRange } from "@/lib/queries";
import { AWARDS, computeAwards } from "@/lib/slop";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Every roasted repo, ranked by Slop Score. The worst of the worst.",
};

function parseRange(value: string | undefined): LeaderboardRange {
  return value === "today" || value === "week" ? value : "all";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; tag?: string; award?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const tag = params.tag;
  const activeAward = params.award;

  // Awards are computed from the full unfiltered set, then applied to whatever
  // subset the filters produce — a badge means "leads this metric overall".
  const all = await getLeaderboard("all");
  const awards = computeAwards(all);

  let entries = await getLeaderboard(range, tag);
  if (activeAward) {
    const award = AWARDS.find((a) => a.id === activeAward);
    if (award) {
      // Rank by the award's own sub-metric when a badge filter is active.
      entries = [...entries].sort(
        (a, b) => b.breakdown[award.key] - a.breakdown[award.key],
      );
    }
  }

  const tags = await getAllTags();
  const activeAwardLabel = AWARDS.find((a) => a.id === activeAward)?.label;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Reveal as="header" y={16} className="border-b-2 border-hairline pb-8">
        <p className="font-display text-xs font-black uppercase tracking-widest text-pop">
          Ranked by Slop Score
        </p>
        <h1 className="mt-2 font-display font-black uppercase text-huge">
          The Leaderboard
        </h1>
        <p className="mt-3 max-w-xl text-ash">
          Higher is worse. Every entry self-submitted, every crime cited. Argue
          with the numbers — that&apos;s engagement.
        </p>
      </Reveal>

      {/* Category award badges — each links to its filtered view. */}
      <section aria-label="Category awards" className="mt-8">
        <div className="flex flex-wrap gap-2">
          {AWARDS.map((award) => {
            const selected = activeAward === award.id;
            return (
              <Link
                key={award.id}
                href={selected ? "/leaderboard" : `/leaderboard?award=${award.id}`}
                className={`press rounded-full border-2 px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${
                  selected
                    ? "border-ink bg-sun text-ink"                    : "border-ink text-ash hover:border-pop hover:text-pop"
                }`}
              >
                {award.label}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs active={range} tag={tag} award={activeAward} />
        {(tag || activeAward) && (
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-ash">
            <span className="text-ash-dim">Filtered:</span>
            {tag ? (
              <span className="rounded-full border-2 border-ink px-3 py-1 text-ink">
                #{tag}
              </span>
            ) : null}
            {activeAwardLabel ? (
              <span className="rounded-full border-2 border-grape px-3 py-1 text-grape">
                {activeAwardLabel}
              </span>
            ) : null}
            <Link href="/leaderboard" className="text-pop hover:underline">
              Clear
            </Link>
          </div>
        )}
      </div>

      {/* Tag filter row */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => {
          const selected = tag === t;
          const params = new URLSearchParams();
          if (!selected) params.set("tag", t);
          if (range !== "all") params.set("range", range);
          const qs = params.toString();
          return (
            <Link
              key={t}
              href={`/leaderboard${qs ? `?${qs}` : ""}`}
              className={`press rounded-full border-2 px-3 py-1 text-xs lowercase tracking-wide ${
                selected
                  ? "border-ink bg-sun-wash text-ink"
                  : "border-hairline text-ash hover:border-ink hover:text-ink"
              }`}
            >
              #{t}
            </Link>
          );
        })}
      </div>

      {entries.length > 0 ? (
        <RevealGroup
          as="ol"
          y={20}
          stagger={0.05}
          className="mt-8 border-t-2 border-hairline"
        >
          {entries.map((entry, i) => (
            <SlopRow
              key={entry.id}
              entry={entry}
              rank={i + 1}
              award={awards.get(entry.id)}
            />
          ))}
        </RevealGroup>
      ) : (
        <div className="mt-8 rounded-[20px] border-2 border-dashed border-ink p-12 text-center">
          <p className="font-display text-2xl font-black uppercase text-ash">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm text-ash-dim">
            No repos match this filter. The slop is out there. Go find it.
          </p>
          <Link
            href="/submit"
            className="press mt-6 inline-block rounded-full border-2 border-ink bg-sun px-6 py-3 font-display text-sm font-black uppercase tracking-widest text-ink"
          >
            Submit the first one
          </Link>
        </div>
      )}
    </div>
  );
}
