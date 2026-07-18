import Link from "next/link";

import { SkullIcon } from "@/components/icons";
import type { SlopEntry } from "@/lib/slop";

/**
 * byooooob's "kissies FROM OUR PARTNERS" card stack, from the other side of
 * the roast.
 *
 * These are REAL roast one-liners pulled from the database, attributed to the
 * repo they were written about. An earlier version used invented testimonials
 * with made-up handles, which is exactly the kind of fake social proof this
 * site exists to mock. The section hides itself rather than inventing content
 * when there is nothing to show yet.
 */
export function Kissies({ entries }: { entries: SlopEntry[] }) {
  const quotes = entries.filter((e) => e.oneLiner?.trim()).slice(0, 3);
  if (quotes.length === 0) return null;

  return (
    <section className="bg-zigzag-grape border-y-2 border-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display font-bold uppercase text-huge">
          <span className="text-sun">Receipts</span>{" "}
          <span className="italic">from the roasted</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center font-sans text-sm text-paper/80">
          Actual lines the engine wrote about actual repositories.
        </p>

        <div
          className={`mt-14 grid gap-8 ${
            quotes.length === 1
              ? "max-w-md mx-auto"
              : quotes.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-3"
          }`}
        >
          {quotes.map((entry, i) => (
            <Link
              key={entry.id}
              href={`/product/${entry.slug}`}
              className={`press block rounded-[24px] border-2 border-ink bg-paper p-7 text-ink shadow-brut ${
                i % 2 === 0 ? "tilt-l" : "tilt-r"
              } transition-transform hover:rotate-0`}
            >
              <div className="flex items-center gap-2 font-display text-lg font-bold uppercase">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-candy">
                  <SkullIcon className="h-4 w-4" />
                </span>
                {entry.name}
              </div>
              <blockquote className="mt-4 font-sans text-lg font-bold leading-snug">
                &ldquo;{entry.oneLiner}&rdquo;
              </blockquote>
              <p className="mt-4 font-sans text-xs uppercase tracking-widest text-ash">
                @{entry.owner} · scored {entry.slopScore}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
