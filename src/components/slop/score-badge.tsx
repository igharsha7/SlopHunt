import { scoreColor } from "@/lib/slop";

/** Compact score chip for leaderboard rows and cards. */
export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-16 w-16 text-3xl"
      : size === "sm"
        ? "h-9 w-11 text-lg"
        : "h-12 w-14 text-2xl";

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-hairline-2 bg-void ${dims}`}
    >
      <span
        className={`tabular font-display font-black leading-none ${scoreColor(score)}`}
      >
        {score}
      </span>
    </div>
  );
}
