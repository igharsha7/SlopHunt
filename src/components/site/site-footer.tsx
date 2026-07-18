import Link from "next/link";

const COLUMNS = [
  {
    heading: "The Site",
    links: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/submit", label: "Submit a repo" },
      { href: "/#how", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
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
    <footer className="border-t-2 border-hairline bg-slab">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-display text-2xl font-black uppercase">
              <span
                aria-hidden
                className="inline-block h-5 w-5 border-2 border-toxic bg-toxic"
              />
              SlopHunt
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              Product Hunt for slop. A directory of unoriginal software, built by
              an idea that is itself gloriously derivative.
            </p>
            <p className="mt-4 text-xs uppercase tracking-widest text-ash-dim">
              Self-submission only. We roast the software, never the person.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="font-display text-xs font-black uppercase tracking-widest text-toxic">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ash transition-colors hover:text-bone"
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
