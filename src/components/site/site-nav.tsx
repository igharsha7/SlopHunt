import Link from "next/link";

import { signInWithGitHub, signOut } from "@/app/auth/actions";
import { GitHubIcon } from "@/components/icons";
import { Brand } from "@/components/site/brand";
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
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link href="/" className="flex shrink-0 items-center" aria-label="SlopHunt home">
          <Brand size="nav" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="press block border-2 border-transparent px-3 py-2 text-xs uppercase tracking-widest text-ash rounded-full hover:bg-cream hover:text-ink"
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
                className="press hidden rounded-full border-2 border-ink bg-sun px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-ink shadow-brut hover:bg-sun-deep sm:block"
              >
                Submit repo
              </Link>
              <div className="flex items-center gap-2 rounded-full border-2 border-hairline py-1 pl-1 pr-2">
                {avatar ? (
                  // 24px external GitHub avatar — next/image would need remote
                  // domain config for no LCP benefit at this size.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border border-ink"
                  />
                ) : null}
                <span className="hidden text-xs uppercase text-ash sm:block">
                  {login ?? "signed in"}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="press px-1 text-xs uppercase tracking-widest text-ash-dim hover:text-pop"
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
                className="press flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-ink shadow-brut hover:bg-sun-deep"
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
