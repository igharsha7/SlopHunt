import type { VideoState } from "@/lib/slop";

const COPY: Record<VideoState, { title: string; sub: string }> = {
  pending: {
    title: "Queued for roasting",
    sub: "The host is warming up. Your video is in line.",
  },
  rendering: {
    title: "Your roast is rendering",
    sub: "The disappointment takes time. Check back in a few minutes.",
  },
  failed: {
    title: "The render gave up",
    sub: "Even the machine couldn't finish. Fitting, honestly.",
  },
  // ready-without-url only happens in the demo / mock mode: the job is done but
  // there's no real HeyGen render to embed. Show a poster, not a blank box.
  ready: {
    title: "Roast on file",
    sub: "Deepak recorded this one. Live video lands here when the pipeline is wired.",
  },
};

/**
 * 9:16 video slot. Ready → embed; otherwise the branded waiting state. The
 * instant page never blocks on this — it just fills in when the job completes.
 */
export function VideoSlot({
  status,
  url,
  repoName,
}: {
  status: VideoState;
  url: string | null;
  repoName: string;
}) {
  if (status === "ready" && url) {
    return (
      <div className="mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[20px] border-2 border-ink bg-paper">
        <video
          src={url}
          controls
          playsInline
          className="h-full w-full object-cover"
          aria-label={`Video roast of ${repoName}`}
        />
      </div>
    );
  }

  const copy = COPY[status];
  const pulsing = status === "pending" || status === "rendering";
  const done = status === "ready";

  return (
    <div
      className={`mx-auto flex aspect-[9/16] w-full max-w-[280px] flex-col items-center justify-center gap-3 rounded-[20px] border-2 p-6 text-center ${
        done ? "border-ink bg-sun-wash" : "border-dashed border-ink bg-cream"
      }`}
    >
      {done ? (
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-paper text-2xl font-black text-ink"
        >
          ▶
        </span>
      ) : (
        <div
          className={`h-3 w-3 rounded-full bg-pop ${pulsing ? "animate-pulse" : "opacity-40"}`}
          aria-hidden
        />
      )}
      <p className="font-display text-lg font-black uppercase leading-tight">
        {copy.title}
      </p>
      <p className="text-xs leading-relaxed text-ash">{copy.sub}</p>
      <span className="mt-2 tabular text-[10px] uppercase tracking-widest text-ash-dim">
        9:16 · under 45s · host: Deepak
      </span>
    </div>
  );
}
