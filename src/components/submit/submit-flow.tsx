"use client";

import { useState } from "react";

import { ArrowIcon, CheckIcon } from "@/components/icons";

const GITHUB_RE =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$|^([\w.-]+)\/([\w.-]+)$/i;

type Phase = "idle" | "checking" | "queued";

/**
 * The signed-in submit form. Phase 1's real pipeline will replace the fake
 * progress with an actual job, but the intake contract — parse, confirm
 * ownership, queue — is what the UI commits to here.
 */
export function SubmitFlow({
  defaultRepo,
  login,
}: {
  defaultRepo: string;
  login: string;
}) {
  const [value, setValue] = useState(defaultRepo);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  function parse(input: string): { owner: string; name: string } | null {
    const m = input.trim().match(GITHUB_RE);
    if (!m) return null;
    return { owner: m[1] ?? m[3], name: m[2] ?? m[4] };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parse(value);
    if (!parsed) {
      setError("Not a GitHub repo. Try github.com/you/your-repo.");
      return;
    }
    setError(null);
    setPhase("checking");
    // Placeholder for the intake agent (ownership / roast-me check + enqueue).
    // Wired to POST /api/submit in Phase 1.
    await new Promise((r) => setTimeout(r, 1400));
    setPhase("queued");
  }

  if (phase === "queued") {
    const parsed = parse(value)!;
    return (
      <div className="mt-10 rounded-[20px] border-2 border-ink bg-sun-wash p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-alive text-paper">
            <CheckIcon className="h-5 w-5" />
          </span>
          <h2 className="font-display text-2xl font-black uppercase">
            Queued for roasting
          </h2>
        </div>
        <p className="mt-4 font-sans text-ash">
          <span className="text-ink">
            {parsed.owner}/{parsed.name}
          </span>{" "}
          is in the pipeline. The crawler is reading your commit history right
          now, and it has opinions. Score and roast land in under thirty seconds;
          the video takes a few minutes.
        </p>
        <div className="mt-6 space-y-2">
          {[
            "Crawling repo + site",
            "Hunting for prior art",
            "Computing Slop Score",
            "Writing the roast",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-3 text-sm uppercase tracking-widest text-ash"
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse bg-pop"
                style={{ animationDelay: `${i * 150}ms` }}
              />
              {step}
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs uppercase tracking-widest text-ash-dim">
          The pipeline isn&apos;t live in this build — this is the intake UI. Wire
          up Phase 1 to make it real.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10" noValidate>
      <div className="border-2 border-ink bg-cream p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ash">
          <span className="h-2 w-2 bg-alive" />
          Signed in as {login}
        </div>

        <label
          htmlFor="repo"
          className="mt-6 block font-display text-sm font-black uppercase tracking-widest"
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
          disabled={phase === "checking"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "repo-error" : "repo-help"}
          className="mt-2 h-14 w-full rounded-full border-2 border-ink bg-paper px-5 font-sans text-base text-ink placeholder:text-ash-dim focus:border-grape focus:outline-none disabled:opacity-50"
        />
        {error ? (
          <p id="repo-error" role="alert" className="mt-2 text-sm text-pop">
            {error}
          </p>
        ) : (
          <p id="repo-help" className="mt-2 text-xs text-ash-dim">
            Must be a repo you own or collaborate on, or one tagged{" "}
            <span className="text-ash">roast-me</span>.
          </p>
        )}

        <button
          type="submit"
          disabled={phase === "checking"}
          className="press mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-sun px-6 py-4 font-display text-base font-black uppercase tracking-widest text-ink shadow-brut hover:bg-sun-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase === "checking" ? (
            "Verifying ownership…"
          ) : (
            <>
              Roast it <ArrowIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
