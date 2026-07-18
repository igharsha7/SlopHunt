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

  // NEXT_PUBLIC_ vars are inlined into both server and client bundles, so this
  // renders identically on both sides — a window.location.origin branch here
  // caused a hydration mismatch on every product page.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = `${base}/product/${slug}`;

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
        className="press inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-5 py-2.5 font-display text-sm font-black uppercase tracking-widest text-ink shadow-brut-sm hover:bg-sun-deep"
      >
        Post my roast
        <ExternalIcon className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={copy}
        className="press inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-display text-sm font-black uppercase tracking-widest text-ink hover:bg-cream"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
