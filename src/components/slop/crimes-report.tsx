import { CRIME_LABELS, type Crime } from "@/lib/slop";

/** The crimes list, styled as a police evidence log. Every joke's receipt. */
export function CrimesReport({ crimes }: { crimes: Crime[] }) {
  return (
    <div className="border-2 border-hairline-2 bg-slab">
      <div className="flex items-center justify-between border-b-2 border-hairline-2 bg-void px-4 py-3">
        <h2 className="font-display text-sm font-black uppercase tracking-widest text-toxic">
          Evidence Log
        </h2>
        <span className="tabular text-xs uppercase tracking-widest text-ash-dim">
          {crimes.length} counts
        </span>
      </div>
      <ol className="divide-y divide-hairline">
        {crimes.map((crime, i) => (
          <li key={i} className="flex gap-4 p-4">
            <span className="tabular shrink-0 font-display text-sm font-black text-ash-dim">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <span className="inline-block border border-hairline-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ash">
                {CRIME_LABELS[crime.category]}
              </span>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-bone">
                {crime.evidence}
              </p>
              {crime.detail ? (
                <p className="mt-1 text-xs italic text-ash">{crime.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
