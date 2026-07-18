import {
  BREAKDOWN_LABELS,
  scoreColor,
  scoreBg,
  scoreVerdict,
  type Breakdown,
} from "@/lib/slop";

/** The big Slop Score reveal + five labelled sub-score bars. */
export function ScoreCard({
  score,
  breakdown,
}: {
  score: number;
  breakdown: Breakdown;
}) {
  return (
    <div className="border-2 border-hairline-2 bg-slab">
      <div className="border-b-2 border-hairline-2 p-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-black uppercase tracking-widest text-ash">
            Slop Score
          </span>
          <span
            className={`font-display text-xs font-black uppercase tracking-widest ${scoreColor(
              score,
            )}`}
          >
            {scoreVerdict(score)}
          </span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span
            className={`tabular font-display text-8xl font-black leading-none ${scoreColor(
              score,
            )}`}
          >
            {score}
          </span>
          <span className="mb-2 font-display text-2xl font-black text-ash-dim">
            /100
          </span>
        </div>
      </div>

      <dl className="divide-y divide-hairline">
        {BREAKDOWN_LABELS.map(({ key, label, blurb }) => {
          const value = breakdown[key];
          return (
            <div key={key} className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="font-display text-sm font-black uppercase tracking-tight">
                  {label}
                </dt>
                <dd
                  className={`tabular font-display text-lg font-black ${scoreColor(
                    value,
                  )}`}
                >
                  {value}
                </dd>
              </div>
              <div
                className="mt-2 h-2 w-full border border-hairline bg-void"
                role="meter"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
              >
                <div
                  className={`h-full ${scoreBg(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ash-dim">{blurb}</p>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
