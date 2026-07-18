import Link from "next/link";

import { StarIcon } from "@/components/icons";
import { ScoreBadge } from "@/components/slop/score-badge";
import { SkullButton } from "@/components/slop/skull-button";
import { relativeTime, scoreVerdict, type SlopEntry } from "@/lib/slop";

/**
 * One leaderboard row, Product Hunt density: rank · avatar · name + tagline +
 * tags · score · skull. Collapses to two rows on mobile.
 */
export function SlopRow({
  entry,
  rank,
  award,
}: {
  entry: SlopEntry;
  rank: number;
  award?: string;
}) {
  return (
    <li className="group relative border-b border-hairline transition-colors hover:bg-slab">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:gap-5 sm:px-6">
        <div className="tabular w-8 shrink-0 text-center font-display text-xl font-black text-ash-dim sm:w-12 sm:text-3xl">
          {rank}
        </div>

        <div
          aria-hidden
          className="hidden h-12 w-12 shrink-0 items-center justify-center border-2 border-hairline-2 bg-void font-display text-lg font-black text-toxic sm:flex"
        >
          {entry.owner.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link
              href={`/product/${entry.slug}`}
              className="truncate font-display text-lg font-black uppercase tracking-tight after:absolute after:inset-0 hover:text-toxic"
            >
              {entry.name}
            </Link>
            {award ? (
              <span className="border border-toxic px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-toxic">
                {award}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-ash">{entry.tagline}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-widest text-ash-dim">
            <span className="text-ash">@{entry.owner}</span>
            {entry.primaryLang ? <span>{entry.primaryLang}</span> : null}
            <span className="inline-flex items-center gap-1">
              <StarIcon className="h-3 w-3" />
              {entry.stars}
            </span>
            <span>updated {relativeTime(entry.lastCommit)}</span>
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="font-display text-[10px] font-black uppercase tracking-widest text-ash-dim">
            {scoreVerdict(entry.slopScore)}
          </span>
          <ScoreBadge score={entry.slopScore} />
        </div>

        {/* z-10 lifts the skull above the row's stretched link overlay. */}
        <div className="relative z-10 shrink-0">
          <SkullButton entryId={entry.id} initialCount={entry.skulls} size="sm" />
        </div>
      </div>
    </li>
  );
}
