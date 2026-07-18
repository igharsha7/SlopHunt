import type { Metadata } from "next";
import Link from "next/link";

import { Reveal, RevealGroup } from "@/components/gsap/reveal";
import { SkullIcon } from "@/components/icons";
import { FilterTabs } from "@/components/leaderboard/filter-tabs";
import { Starburst, StickerLabel } from "@/components/site/stickers";
import { SlopRow } from "@/components/slop/slop-row";
import { getAllTags, getLeaderboard, type LeaderboardRange } from "@/lib/queries";
import { AWARDS, computeAwards, scoreVerdict, type SlopEntry } from "@/lib/slop";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Every roasted repo, ranked by Slop Score. The worst of the worst.",
};

function parseRange(value: string | undefined): LeaderboardRange {
  return value === "today" || value === "week" ? value : "all";
}

/** Podium card — the top three get byooooob trading-card treatment. */
function PodiumCard({
  entry,
  place,
  award,
}: {
  entry: SlopEntry;
  place: 1 | 2 | 3;
  award?: string;
}) {
  const look =
    place === 1
      ? "bg-sun md:order-2 md:-mt-6"
      : place === 2
        ? "bg-candy tilt-l md:order-1"
        : "bg-cream tilt-r md:order-3";

  return (
    <Link
      href={`/product/${entry.slug}`}
      className={`press relative block rounded-[24px] border-2 border-ink p-6 text-ink shadow-brut transition-transform hover:rotate-0 ${look}`}
    >
      <span className="tabular absolute -left-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-paper font-display text-xl font-bold shadow-brut-sm">
        {place}
      </span>
      {award ? (
        <span className="absolute -right-2 -top-3 max-w-[60%] truncate rounded-full border-2 border-grape bg-paper px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-grape shadow-brut-sm">
          {award}
        </span>
      ) : null}
      <span className="tabular mt-2 block font-display text-7xl font-bold leading-none text-pop">
        {entry.slopScore}
      </span>
      <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-ash">
        Slop Score · {scoreVerdict(entry.slopScore)}
      </span>
      <span className="mt-3 block truncate border-t-2 border-ink pt-3 font-display text-xl font-bold uppercase leading-tight">
        {entry.name}
      </span>
      <span className="mt-1 line-clamp-2 block font-sans text-sm text-ash">
        {entry.tagline}
      </span>
      <span className="tabular mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-1 font-sans text-xs font-bold">
        <SkullIcon className="h-3.5 w-3.5" />
        {entry.skulls.toLocaleString()}
      </span>
    </Link>
  );
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

  const podium = entries.slice(0, 3);
  const table = entries.slice(3);
  const totalSkulls = entries.reduce((sum, e) => sum + e.skulls, 0);

  return (
    <div className="bg-grid-paper">
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Starburst
          aria-hidden
          className="pointer-events-none absolute right-[2%] top-8 hidden h-20 w-20 text-grape lg:block"
        />

        {/* ------------------------------------------------------- HEADER */}
        <Reveal as="header" y={16}>
          <h1 className="font-display font-bold uppercase text-mega">
            The slop
            <br />
            leaderboard
          </h1>
          <StickerLabel tilt="l" className="mt-4">
            Higher is worse. Obviously.
          </StickerLabel>
          <div className="mt-6 flex flex-wrap gap-2 font-sans text-[11px] font-bold uppercase tracking-widest">
            <span className="rounded-full border border-ink bg-paper px-3 py-1.5 shadow-brut-sm">
              {entries.length} repos ranked
            </span>
            <span className="tabular inline-flex items-center gap-1.5 rounded-full border border-ink bg-paper px-3 py-1.5 shadow-brut-sm">
              <SkullIcon className="h-3.5 w-3.5" />
              {totalSkulls.toLocaleString()} skulls given
            </span>
            <span className="rounded-full border border-ink bg-sun px-3 py-1.5 shadow-brut-sm">
              Every entry self-submitted
            </span>
          </div>
        </Reveal>

        {/* ------------------------------------------------------ FILTERS */}
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs active={range} tag={tag} award={activeAward} />
          {(tag || activeAward) && (
            <div className="flex flex-wrap items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-ash">
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

        {/* Category awards — each links to its filtered, re-ranked view. */}
        <section aria-label="Category awards" className="mt-5">
          <div className="flex flex-wrap gap-2">
            {AWARDS.map((award) => {
              const selected = activeAward === award.id;
              return (
                <Link
                  key={award.id}
                  href={selected ? "/leaderboard" : `/leaderboard?award=${award.id}`}
                  className={`press rounded-full border-2 px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-widest ${
                    selected
                      ? "border-ink bg-grape text-paper shadow-brut-sm"
                      : "border-ink bg-paper text-ink hover:bg-sun-wash"
                  }`}
                >
                  {award.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Tag filter row */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const selected = tag === t;
            const qs = new URLSearchParams();
            if (!selected) qs.set("tag", t);
            if (range !== "all") qs.set("range", range);
            const href = `/leaderboard${qs.toString() ? `?${qs}` : ""}`;
            return (
              <Link
                key={t}
                href={href}
                className={`press rounded-full border px-3 py-1 font-sans text-xs lowercase tracking-wide ${
                  selected
                    ? "border-ink bg-sun text-ink"
                    : "border-ash-dim/60 text-ash hover:border-ink hover:text-ink"
                }`}
              >
                #{t}
              </Link>
            );
          })}
        </div>

        {/* ------------------------------------------------------- PODIUM */}
        {podium.length > 0 ? (
          <RevealGroup
            y={30}
            stagger={0.12}
            className="mt-14 grid gap-8 pl-3 pt-3 md:grid-cols-3 md:gap-6"
          >
            {podium.map((entry, i) => (
              <PodiumCard
                key={entry.id}
                entry={entry}
                place={(i + 1) as 1 | 2 | 3}
                award={awards.get(entry.id)}
              />
            ))}
          </RevealGroup>
        ) : (
          <div className="mt-14 rounded-[24px] border-2 border-dashed border-ink p-12 text-center">
            <p className="font-display text-3xl font-bold uppercase">
              Nothing here yet
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-sm text-ash">
              No repos match this filter. The slop is out there — go find it,
              or clear the filter.
            </p>
            <Link
              href="/submit"
              className="press mt-6 inline-block rounded-full border-2 border-ink bg-sun px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-ink shadow-brut"
            >
              Submit the first one
            </Link>
          </div>
        )}

        {/* ---------------------------------------------------- FULL TABLE */}
        {table.length > 0 ? (
          <>
            <Reveal className="mt-16 flex items-end justify-between gap-4">
              <h2 className="font-display text-big font-bold uppercase">
                The rest of the wreckage
              </h2>
              <span className="tabular hidden font-sans text-xs font-bold uppercase tracking-widest text-ash sm:block">
                Ranks 4–{entries.length}
              </span>
            </Reveal>
            <RevealGroup
              as="ol"
              y={20}
              stagger={0.05}
              className="mt-6 overflow-hidden rounded-[24px] border-2 border-ink bg-cream shadow-brut"
            >
              {table.map((entry, i) => (
                <SlopRow
                  key={entry.id}
                  entry={entry}
                  rank={i + 4}
                  award={awards.get(entry.id)}
                />
              ))}
            </RevealGroup>
          </>
        ) : null}
      </div>
    </div>
  );
}
