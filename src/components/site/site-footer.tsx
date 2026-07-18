import Link from "next/link";

import { GitHubIcon } from "@/components/icons";
import { Brand } from "@/components/site/brand";
import { REPO_URL } from "@/lib/faq-content";

const COLUMNS = [
  {
    heading: "The Site",
    links: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/submit", label: "Submit a repo" },
      { href: "/how", label: "How it works" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "The Awards",
    links: [
      { href: "/leaderboard?award=most-abandoned", label: "Most Abandoned" },
      { href: "/leaderboard?award=ai-wrapper", label: "AI Wrapper of the Day" },
      { href: "/leaderboard?award=peak-2021", label: "Peak 2021" },
      { href: "/leaderboard?award=nobody-asked", label: "Solved Nobody's Problem" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-hairline bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Brand size="footer" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              Product Hunt for slop. A directory of unoriginal software, built by
              an idea that is itself gloriously derivative.
            </p>
            <p className="mt-4 text-xs uppercase tracking-widest text-ash-dim">
              Self-submission only. We roast the software, never the person.
            </p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="press mt-5 inline-flex items-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-ink shadow-brut-sm hover:bg-sun"
            >
              <GitHubIcon className="h-4 w-4" />
              Open source — star it
            </a>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="font-display text-xs font-black uppercase tracking-widest text-pop">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ash transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 text-xs uppercase tracking-widest text-ash-dim sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} SlopHunt · No repos were spared</span>
          <span>The roast is about the code. Always.</span>
        </div>
      </div>
    </footer>
  );
}
