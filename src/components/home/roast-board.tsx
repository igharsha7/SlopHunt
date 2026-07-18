import Link from "next/link";

import { RevealGroup } from "@/components/gsap/reveal";
import { ArrowIcon, SkullIcon } from "@/components/icons";
import { scoreVerdict, type SlopEntry } from "@/lib/slop";

/**
 * byooooob's "damn! We did this?" section, repurposed: full-bleed purple with
 * sunburst rays, work rows become the freshest roasts, and the left card is a
 * giant tilted Slop Score sticker. The full table lives at /leaderboard —
 * this is the teaser that sends you there.
 */
export function RoastBoard({ entries }: { entries: SlopEntry[] }) {
  const [champion, ...rest] = entries;
  if (!champion) return null;

  return (
    <section className="bg-rays-grape border-y-2 border-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[380px_1fr] lg:gap-16">
        {/* Left: champion sticker card + view all */}
        <div className="flex flex-col items-center gap-8 lg:items-start">
          <Link
            href={`/product/${champion.slug}`}
            className="press tilt-l block w-full max-w-[340px] rounded-[24px] border-2 border-ink bg-sun p-6 text-ink shadow-brut transition-transform hover:rotate-0"
          >
            <span className="font-sans text-xs font-bold uppercase tracking-widest">
              Today&apos;s sloppiest
            </span>
            <span className="tabular mt-2 block font-display text-8xl font-bold leading-none text-pop">
              {champion.slopScore}
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-ash">
              Slop Score
            </span>
            <span className="mt-4 block border-t-2 border-ink pt-3 font-display text-2xl font-bold uppercase leading-tight">
              {champion.name}
            </span>
            <span className="mt-1 block font-sans text-sm text-ink/70">
              {champion.oneLiner}
            </span>
          </Link>

          <Link
            href="/leaderboard"
            className="press inline-flex items-center gap-2 rounded-full border border-ink bg-paper px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-ink shadow-brut hover:bg-sun"
          >
            View the leaderboard
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Right: heading + roast rows */}
        <div className="min-w-0">
          <h2 className="font-display font-bold uppercase text-huge">
            <span className="text-sun">Damn!</span>{" "}
            <span className="italic">They shipped this?</span>
          </h2>

          <RevealGroup as="ul" y={18} stagger={0.07} className="mt-10">
            {rest.slice(0, 4).map((entry) => (
              <li key={entry.id} className="border-t border-paper/25">
                <Link
                  href={`/product/${entry.slug}`}
                  className="group flex flex-wrap items-center gap-x-4 gap-y-2 py-5 sm:flex-nowrap"
                >
                  <span className="min-w-0 flex-1 truncate font-display text-2xl font-bold uppercase tracking-tight text-paper/80 transition-colors group-hover:text-sun sm:text-3xl">
                    {entry.name}
                  </span>
                  <ArrowIcon className="h-5 w-5 shrink-0 -rotate-45 text-paper/60 transition-colors group-hover:text-sun" />
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-paper/70 px-3 py-1 font-sans text-xs font-bold uppercase tracking-widest">
                      {scoreVerdict(entry.slopScore)}
                    </span>
                    <span className="tabular rounded-full border border-paper/70 px-3 py-1 font-sans text-xs font-bold uppercase tracking-widest">
                      {entry.slopScore}/100
                    </span>
                    <span className="tabular hidden items-center gap-1 rounded-full border border-paper/70 px-3 py-1 font-sans text-xs font-bold uppercase tracking-widest sm:inline-flex">
                      <SkullIcon className="h-3.5 w-3.5" />
                      {entry.skulls.toLocaleString()}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
