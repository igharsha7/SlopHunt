"use client";

import { useState } from "react";

import { ExternalIcon } from "@/components/icons";

/** Pre-filled X post + copy-link. This is the share loop; keep it one tap. */
export function ShareButton({
  slug,
  name,
  score,
  oneLiner,
}: {
  slug: string;
  name: string;
  score: number;
  oneLiner: string;
}) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${slug}`
      : `/product/${slug}`;

  const text = `${name} scored ${score}/100 on the SlopHunt leaderboard.\n\n"${oneLiner}"\n\nGet your repo roasted:`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text,
  )}&url=${encodeURIComponent(url)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — X share still works.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="press inline-flex items-center gap-2 border-2 border-toxic bg-toxic px-4 py-2.5 font-display text-sm font-black uppercase tracking-widest text-void hover:bg-toxic-dim"
      >
        Post my roast
        <ExternalIcon className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={copy}
        className="press inline-flex items-center gap-2 border-2 border-hairline-2 px-4 py-2.5 font-display text-sm font-black uppercase tracking-widest text-bone hover:border-bone"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
