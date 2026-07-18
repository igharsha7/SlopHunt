"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CheckIcon } from "@/components/icons";

const GITHUB_RE =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$|^([\w.-]+)\/([\w.-]+)$/i;

const STAGES = [
  "Crawling repo + site",
  "Hunting for prior art",
  "Computing Slop Score",
  "Writing the roast",
];

type Phase = "idle" | "running" | "error";

/**
 * The signed-in submit form. POSTs to /api/submit, which runs the real
 * pipeline (intake gate → crawl → score → roast) and returns the page slug.
 * The stage ticker is honest about order but not timing — the server does all
 * four regardless of where the animation is.
 */
export function SubmitFlow({
  defaultRepo,
  login,
}: {
  defaultRepo: string;
  login: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultRepo);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function parse(input: string): string | null {
    const m = input.trim().match(GITHUB_RE);
    if (!m) return null;
    return `${m[1] ?? m[3]}/${m[2] ?? m[4]}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const repo = parse(value);
    if (!repo) {
      setError("Not a GitHub repo. Try github.com/you/your-repo.");
      return;
    }

    setError(null);
    setPhase("running");
    setStage(0);
    timerRef.current = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      3500,
    );

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      const data = (await res.json()) as { slug?: string; error?: string };

      if (!res.ok || !data.slug) {
        setPhase("error");
        setError(data.error ?? "The pipeline choked. Try again.");
        return;
      }

      router.push(`/product/${data.slug}`);
    } catch {
      setPhase("error");
      setError("Network hiccup. The roast is willing; the connection was weak.");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  if (phase === "running") {
    return (
      <div className="mt-10 rounded-[20px] border-2 border-ink bg-sun-wash p-8 shadow-brut">
        <h2 className="font-display text-2xl font-bold uppercase">
          Roasting {parse(value)}
        </h2>
        <p className="mt-2 font-sans text-sm text-ash">
          The agents are reading everything. This usually takes under thirty
          seconds.
        </p>
        <div className="mt-6 space-y-3">
          {STAGES.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 font-sans text-sm font-bold uppercase tracking-widest ${
                i < stage
                  ? "text-alive"
                  : i === stage
                    ? "text-ink"
                    : "text-ash-dim"
              }`}
            >
              {i < stage ? (
                <CheckIcon className="h-4 w-4 shrink-0" />
              ) : (
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    i === stage ? "animate-pulse bg-pop" : "bg-ash-dim/40"
                  }`}
                />
              )}
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10" noValidate>
      <div className="rounded-[20px] border-2 border-ink bg-cream p-6 shadow-brut">
        <div className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-ash">
          <span className="h-2 w-2 rounded-full bg-alive" />
          Signed in as {login}
        </div>

        <label
          htmlFor="repo"
          className="mt-6 block font-display text-sm font-bold uppercase tracking-widest"
        >
          Your repository
        </label>
        <input
          id="repo"
          name="repo"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="github.com/you/your-regret"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "repo-error" : "repo-help"}
          className="mt-2 h-14 w-full rounded-full border border-ink bg-paper px-5 font-sans text-base text-ink placeholder:text-ash-dim focus:border-grape focus:outline-none"
        />
        {error ? (
          <p
            id="repo-error"
            role="alert"
            className="mt-2 font-sans text-sm font-bold text-pop"
          >
            {error}
          </p>
        ) : (
          <p id="repo-help" className="mt-2 font-sans text-xs text-ash-dim">
            A repo you own, or any repo tagged{" "}
            <span className="font-bold text-ash">roast-me</span>.
          </p>
        )}

        <button
          type="submit"
          className="press mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-ink bg-ink px-6 py-4 font-display text-base font-bold uppercase tracking-widest text-paper shadow-brut hover:bg-grape disabled:cursor-not-allowed disabled:opacity-60"
        >
          Roast it
          <span className="rounded-full bg-sun px-2.5 py-1 font-sans text-[11px] font-bold tracking-wider text-ink">
            no take-backs*
          </span>
        </button>
        <p className="mt-3 text-center font-sans text-[11px] text-ash-dim">
          *There are take-backs. The delete button is instant.
        </p>
      </div>
    </form>
  );
}
