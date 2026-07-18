import type { Metadata } from "next";
import Link from "next/link";

import { signInWithGitHub } from "@/app/auth/actions";
import { CheckIcon, GitHubIcon } from "@/components/icons";
import { SubmitFlow } from "@/components/submit/submit-flow";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Submit a repo",
  description: "Self-submission only. Sign in with GitHub and feed us your regret.",
};

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>;
}) {
  const { repo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-display text-xs font-black uppercase tracking-widest text-toxic">
        Intake
      </p>
      <h1 className="mt-2 font-display font-black uppercase text-huge">
        Feed us
        <br />
        your regret
      </h1>

      {user ? (
        <SubmitFlow
          defaultRepo={repo ?? ""}
          login={(user.user_metadata?.user_name as string) ?? "you"}
        />
      ) : (
        <div className="mt-10 border-2 border-hairline-2 bg-slab p-8">
          <h2 className="font-display text-2xl font-black uppercase">
            Sign in first
          </h2>
          <p className="mt-3 text-ash">
            Self-submission only. You can only roast repos you own or collaborate
            on — that&apos;s the one rule that keeps this from being a harassment
            tool. Sign in with GitHub to prove it&apos;s yours.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-ash">
            {[
              "We request read-only access to your public profile",
              "We never write to your account or repos",
              "Or: add the roast-me topic to any repo, no sign-in needed",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-toxic" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <form action={signInWithGitHub} className="mt-8">
            <input
              type="hidden"
              name="next"
              value={repo ? `/submit?repo=${encodeURIComponent(repo)}` : "/submit"}
            />
            <button
              type="submit"
              className="press inline-flex items-center gap-2 border-2 border-toxic bg-toxic px-6 py-3.5 font-display text-base font-black uppercase tracking-widest text-void shadow-brut-bone hover:bg-toxic-dim"
            >
              <GitHubIcon className="h-5 w-5" /> Sign in with GitHub
            </button>
          </form>
        </div>
      )}

      <p className="mt-8 text-center text-xs uppercase tracking-widest text-ash-dim">
        Changed your mind?{" "}
        <Link href="/leaderboard" className="text-ash hover:text-toxic">
          Just watch others suffer
        </Link>
      </p>
    </div>
  );
}
