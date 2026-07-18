import Link from "next/link";

import { HeroIntro } from "@/components/gsap/hero-intro";
import { Reveal, RevealGroup } from "@/components/gsap/reveal";
import { Faq } from "@/components/home/faq";
import { RotatingWord } from "@/components/home/rotating-word";
import { SubmitBox } from "@/components/home/submit-box";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { Marquee } from "@/components/site/marquee";
import { SlopRow } from "@/components/slop/slop-row";
import { getLeaderboard } from "@/lib/queries";
import { computeAwards } from "@/lib/slop";

export default async function HomePage() {
  const entries = await getLeaderboard();
  const awards = computeAwards(entries);
  const top = entries.slice(0, 5);

  const totalSkulls = entries.reduce((sum, e) => sum + e.skulls, 0);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden border-b-2 border-hairline">
        <HeroIntro>
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
            <div
              data-hero-chip
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-[11px] uppercase tracking-widest text-ash"
            >
              <span className="inline-block h-2 w-2 rounded-full animate-pulse bg-pop" />
              {entries.length} repos roasted · {totalSkulls.toLocaleString()}{" "}
              skulls given
            </div>

            <h1 className="mt-6 font-display font-black uppercase text-mega">
              <span data-hero-line className="block">
                Submit your repo.
              </span>
              <span data-hero-line className="block">
                Get <span className="text-stroke-ink">roasted</span>.
              </span>
              <span data-hero-line className="block">
                Get ranked.
              </span>
            </h1>

            <p
              data-hero-sub
              className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-ash sm:text-lg"
            >
              Product Hunt&apos;s evil twin. An AI agent crawls your GitHub,
              finds the{" "}
              <span className="whitespace-nowrap font-bold text-ink">
                <RotatingWord
                  words={[
                    "dead demo link",
                    '"final final v2"',
                    "committed .env",
                    "41 TODOs",
                    "abandoned branch",
                    "AI wrapper",
                  ]}
                />
              </span>{" "}
              and scores the slop — on a public leaderboard you did not ask for.
            </p>

            <div data-hero-submit className="mt-10 max-w-2xl">
              <SubmitBox />
            </div>

            <div
              data-hero-checks
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-widest text-ash-dim"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-alive" /> Instant score
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-alive" /> Already-exists
                receipts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-alive" /> Video roast
              </span>
            </div>
          </div>
        </HeroIntro>
      </section>

      {/* ------------------------------------------------------------- MARQUEE */}
      <div className="border-y-2 border-ink bg-sun py-3 text-ink">
        <Marquee
          items={[
            "THIS ALREADY EXISTS",
            "THE DISAPPOINTMENT TAKES TIME",
            "YOUR REPO, YOUR FUNERAL",
            "NOBODY ASKED FOR THIS",
            "GET RANKED",
          ]}
          duration={26}
        />
      </div>

      {/* --------------------------------------------------------- LEADERBOARD */}
      <section className="border-b-2 border-hairline">
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-xs font-black uppercase tracking-widest text-pop">                The Slop Leaderboard
              </p>
              <h2 className="mt-2 font-display font-black uppercase text-huge">
                Today&apos;s worst
              </h2>
            </div>
            <Link
              href="/leaderboard"
              className="press inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-display text-sm font-black uppercase tracking-widest hover:bg-ink hover:text-sun"
            >
              See all
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <RevealGroup as="ol" y={20} stagger={0.06} className="mt-8 border-t-2 border-hairline">
          {top.map((entry, i) => (
            <SlopRow
              key={entry.id}
              entry={entry}
              rank={i + 1}
              award={awards.get(entry.id)}
            />
          ))}
        </RevealGroup>
      </section>

      {/* ------------------------------------------------------------- HOW */}
      <section id="how" className="scroll-mt-20 border-b-2 border-hairline">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="max-w-3xl font-display font-black uppercase text-huge">
              Four agents. One verdict.
            </h2>
            <p className="mt-4 max-w-xl text-ash">
              Paste a URL. The pipeline crawls the repo and its site in
              parallel, hunts for prior art, scores the slop, and writes the
              roast. Text and score land in under thirty seconds.
            </p>
          </Reveal>

          <RevealGroup
            as="ol"
            y={32}
            stagger={0.09}
            className="mt-12 grid gap-px overflow-hidden rounded-[20px] border-2 border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                n: "01",
                t: "Crawl",
                d: "README, 100 commits, languages, file tree, dead demo links, committed secrets.",
              },
              {
                n: "02",
                t: "Hunt receipts",
                d: "Web + GitHub search for the 2–3 real products that already do this.",
              },
              {
                n: "03",
                t: "Score",
                d: "Five deterministic-ish sub-scores and a citable crimes list. No joke without evidence.",
              },
              {
                n: "04",
                t: "Roast",
                d: "Deepak reads your crimes back to you. Instant page now, video when it renders.",
              },
            ].map((step) => (
              <li key={step.n} className="bg-paper p-6">
                <div className="font-display text-4xl font-black text-pop">
                  {step.n}
                </div>
                <h3 className="mt-4 font-display text-xl font-black uppercase">
                  {step.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">{step.d}</p>
              </li>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* -------------------------------------------------------- CRIMES BAND */}
      <section className="border-b-2 border-hairline bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <p className="font-display text-xs font-black uppercase tracking-widest text-pop">              A sample of crimes
            </p>
            <h2 className="mt-2 max-w-3xl font-display font-black uppercase text-huge">
              Every joke cites evidence
            </h2>
          </Reveal>
          <RevealGroup
            as="ul"
            y={18}
            stagger={0.05}
            className="mt-10 grid gap-x-10 gap-y-4 sm:grid-cols-2"
          >
            {[
              "README promises AI. It is three if-statements.",
              'Last commit: "final final v2" — 14 months ago.',
              "node_modules committed. 12,400 files in version control.",
              "The $49/month tier has no auth and no database.",
              "deleteTask() is public with no access control.",
              "requirements.txt pins an SDK that no longer imports.",
              "This already exists. Here are three links.",
              "487 commits. Forty-one of them say 'update'.",
            ].map((crime) => (
              <li
                key={crime}
                className="flex items-start gap-3 border-b border-hairline py-3"
              >
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-alive" />
                <span className="text-ink">{crime}</span>
              </li>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <section id="faq" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="font-display font-black uppercase text-huge">
              Questions you
              <br />
              should have asked
            </h2>
          </Reveal>
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="border-t-2 border-ink bg-sun text-ink">
        <Reveal y={28} className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-4xl font-display font-black uppercase text-huge">
            Your repo is already slop.
            <br />
            Might as well rank.
          </h2>
          <div className="mx-auto mt-10 max-w-xl">
            <Link
              href="/submit"
              className="press inline-flex items-center gap-3 rounded-full border-2 border-ink bg-ink px-8 py-4 font-display text-lg font-black uppercase tracking-widest text-sun shadow-brut hover:bg-paper hover:text-ink"
            >
              Submit your repo
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
