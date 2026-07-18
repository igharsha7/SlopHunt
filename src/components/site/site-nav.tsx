import Link from "next/link";

import { signInWithGitHub, signOut } from "@/app/auth/actions";
import { GitHubIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const login = user?.user_metadata?.user_name as string | undefined;
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-hairline bg-void/90 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="group flex items-center gap-2 font-display text-xl font-black uppercase tracking-tight"
        >
          <span
            aria-hidden
            className="inline-block h-5 w-5 border-2 border-toxic bg-toxic transition-colors group-hover:bg-transparent"
          />
          SlopHunt
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="press block border-2 border-transparent px-3 py-2 text-xs uppercase tracking-widest text-ash hover:border-hairline hover:text-bone"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/submit"
                className="press hidden border-2 border-toxic bg-toxic px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-void shadow-brut-bone hover:bg-toxic-dim sm:block"
              >
                Submit repo
              </Link>
              <div className="flex items-center gap-2 border-2 border-hairline px-2 py-1">
                {avatar ? (
                  // 24px external GitHub avatar — next/image would need remote
                  // domain config for no LCP benefit at this size.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 border border-hairline-2"
                  />
                ) : null}
                <span className="hidden text-xs uppercase text-ash sm:block">
                  {login ?? "signed in"}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="press px-1 text-xs uppercase tracking-widest text-ash-dim hover:text-blood"
                  >
                    Out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <form action={signInWithGitHub}>
              <input type="hidden" name="next" value="/submit" />
              <button
                type="submit"
                className="press flex items-center gap-2 border-2 border-toxic bg-toxic px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-void shadow-brut-bone hover:bg-toxic-dim"
              >
                <GitHubIcon className="h-4 w-4" />
                Sign in
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}
