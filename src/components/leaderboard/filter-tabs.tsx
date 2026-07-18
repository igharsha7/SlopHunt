import Link from "next/link";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All Time" },
] as const;

/** Range tabs. Server-driven via querystring so results are shareable + SSR'd. */
export function FilterTabs({
  active,
  tag,
  award,
}: {
  active: string;
  tag?: string;
  award?: string;
}) {
  function href(range: string) {
    const params = new URLSearchParams();
    if (range !== "all") params.set("range", range);
    if (tag) params.set("tag", tag);
    if (award) params.set("award", award);
    const qs = params.toString();
    return `/leaderboard${qs ? `?${qs}` : ""}`;
  }

  return (
    <div
      role="tablist"
      aria-label="Time range"
      className="inline-flex border-2 border-hairline-2"
    >
      {RANGES.map((range, i) => {
        const selected = active === range.value;
        return (
          <Link
            key={range.value}
            href={href(range.value)}
            role="tab"
            aria-selected={selected}
            className={`press px-4 py-2.5 font-display text-xs font-black uppercase tracking-widest sm:text-sm ${
              i > 0 ? "border-l-2 border-hairline-2" : ""
            } ${
              selected
                ? "bg-toxic text-void"
                : "bg-void text-ash hover:bg-slab hover:text-bone"
            }`}
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}
