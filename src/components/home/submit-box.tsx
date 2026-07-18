"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";


const GITHUB_RE =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i;

/**
 * Hero submit box. Validates the URL shape client-side for instant feedback,
 * then routes to /submit which enforces the real rule: ownership or a
 * roast-me topic (safety rail 1). This input cannot roast anyone by itself.
 */
export function SubmitBox() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = value.trim().match(GITHUB_RE);
    if (!match) {
      setError("That's not a GitHub repo URL. Try github.com/you/your-repo.");
      return;
    }
    setError(null);
    router.push(`/submit?repo=${encodeURIComponent(`${match[1]}/${match[2]}`)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="repo-url" className="sr-only">
            GitHub repository URL
          </label>
          <input
            id="repo-url"
            name="repo-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="github.com/you/your-regret"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "repo-error" : undefined}
            className="h-14 w-full rounded-full border border-ink bg-cream px-5 font-sans text-base text-ink shadow-brut-sm placeholder:text-ash-dim focus:border-grape focus:outline-none"
          />
        </div>
        {/* Their CTA anatomy: black pill, white text, yellow mini-chip inside. */}
        <button
          type="submit"
          className="press flex h-14 items-center justify-center gap-2.5 rounded-full border border-ink bg-ink pl-7 pr-3 font-display text-base font-bold uppercase tracking-widest text-paper shadow-brut hover:bg-grape"
        >
          Roast it
          <span className="rounded-full bg-sun px-2.5 py-1 font-sans text-[11px] font-bold tracking-wider text-ink">
            in 30 secs
          </span>
        </button>
      </div>
      {error ? (
        <p id="repo-error" role="alert" className="mt-2 text-sm text-pop">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs uppercase tracking-widest text-ash-dim">
          Self-submission only · Your repo, your funeral
        </p>
      )}
    </form>
  );
}
