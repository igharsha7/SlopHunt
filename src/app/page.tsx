import Link from "next/link";

import { HeroIntro } from "@/components/gsap/hero-intro";
import { Reveal, RevealGroup } from "@/components/gsap/reveal";
import { Faq } from "@/components/home/faq";
import { Kissies } from "@/components/home/kissies";
import { RoastBoard } from "@/components/home/roast-board";
import { RotatingWord } from "@/components/home/rotating-word";
import { SubmitBox } from "@/components/home/submit-box";
import { ArrowIcon } from "@/components/icons";
import { Marquee } from "@/components/site/marquee";
import {
  BlobFlower,
  CursorArrow,
  EyesSticker,
  Starburst,
  StickerLabel,
} from "@/components/site/stickers";
import { getLeaderboard } from "@/lib/queries";

const CRIME_TICKER = [
  "README PROMISES AI. IT IS THREE IF-STATEMENTS",
  'LAST COMMIT: "FINAL FINAL V2"',
  "NODE_MODULES COMMITTED",
  "THE DEMO LINK IS A 404",
  "THIS ALREADY EXISTS",
  "487 COMMITS NAMED 'UPDATE'",
];

const CRIME_TICKER_2 = [
  "YOUR REPO, YOUR FUNERAL",
  "THE DISAPPOINTMENT TAKES TIME",
  "NOBODY ASKED FOR THIS",
  "GET ROASTED. GET RANKED",
  "WE HAVE SEEN WORSE. BARELY",
];

export default async function HomePage() {
  const entries = await getLeaderboard();
  const totalSkulls = entries.reduce((sum, e) => sum + e.skulls, 0);
  const [first, second] = entries;

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="bg-grid-paper relative overflow-hidden border-b-2 border-ink">
        {/* Floating deco — byooooob sticker field. */}
        <Starburst
          aria-hidden
          className="pointer-events-none absolute left-[4%] top-14 hidden h-24 w-24 text-ink md:block"
        />
        <BlobFlower
          aria-hidden
          className="pointer-events-none absolute right-[26%] top-10 hidden h-20 w-20 text-pop md:block"
        />
        <CursorArrow
          aria-hidden
          className="pointer-events-none absolute bottom-24 left-[38%] hidden h-12 w-12 text-sun md:block"
        />

        {/* Tilted roast trading-cards, like their team cards. */}
        {first ? (
          <Link
            href={`/product/${first.slug}`}
            className="tilt-r absolute right-[3%] top-24 hidden w-52 rounded-[20px] border-2 border-ink bg-sun p-4 text-ink shadow-brut transition-transform hover:rotate-0 xl:block"
          >
            <span className="tabular block font-display text-6xl font-bold leading-none text-pop">
              {first.slopScore}
            </span>
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
              Slop Score
            </span>
            <span className="mt-2 block truncate border-t-2 border-ink pt-2 font-display text-base font-bold uppercase">
              {first.name}
            </span>
          </Link>
        ) : null}
        {second ? (
          <Link
            href={`/product/${second.slug}`}
            className="tilt-l absolute bottom-24 right-[9%] hidden w-48 rounded-[20px] border-2 border-ink bg-candy p-4 text-ink shadow-brut transition-transform hover:rotate-0 xl:block"
          >
            <span className="tabular block font-display text-5xl font-bold leading-none">
              {second.slopScore}
            </span>
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
              Slop Score
            </span>
            <span className="mt-2 block truncate border-t-2 border-ink pt-2 font-display text-sm font-bold uppercase">
              {second.name}
            </span>
          </Link>
        ) : null}

        <HeroIntro>
          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
            <div
              data-hero-chip
              className="inline-flex items-center gap-2 rounded-full border border-ink bg-paper px-4 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest text-ink shadow-brut-sm"
            >
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-pop" />
              {entries.length} repos roasted · {totalSkulls.toLocaleString()}{" "}
              skulls given
            </div>

            <h1 className="mt-8 font-display font-bold uppercase text-mega">
              <span data-hero-line className="block">
                Submit your
              </span>
              <span data-hero-line className="block">
                repo. Get <EyesSticker /> roasted
              </span>
              <span data-hero-line className="block">
                for{" "}
                <RotatingWord
                  variant="display"
                  words={[
                    "dead demo links",
                    '"final final v2"',
                    "committed .env",
                    "41 todos",
                    "ai wrappers",
                    "zero receipts",
                  ]}
                />
              </span>
            </h1>

            <p
              data-hero-sub
              className="mt-7 max-w-xl font-sans text-base leading-relaxed text-ash sm:text-lg"
            >
              Product Hunt&apos;s evil twin. The agent reads your commits, finds
              the crimes, scores the slop, and ranks you in public. It has
              opinions.
            </p>

            <div data-hero-submit className="mt-9 max-w-2xl">
              <SubmitBox />
            </div>
          </div>
        </HeroIntro>
      </section>

      {/* -------------------------------------------- DOUBLE MARQUEE, THEIR WAY */}
      <div className="bg-grape py-3 text-candy">
        <Marquee items={CRIME_TICKER} duration={30} />
      </div>
      <div className="border-y-2 border-ink bg-candy py-3 text-grape">
        <Marquee items={CRIME_TICKER_2} duration={34} reverse />
      </div>

      {/* ----------------------------------------- LEADERBOARD TEASER (PURPLE) */}
      <RoastBoard entries={entries} />

      {/* --------------------------------------------------- PROCESS (PINK) */}
      <section id="how" className="bg-grid-candy scroll-mt-20 border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="max-w-3xl font-display font-bold uppercase text-huge">
              Four agents.
              <br />
              One verdict.
            </h2>
            <StickerLabel tilt="r" className="mt-4">
              Instant score. The video takes a minute.
            </StickerLabel>
          </Reveal>

          <RevealGroup
            as="ol"
            y={32}
            stagger={0.09}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
                d: "Five sub-scores and a citable crimes list. No joke without evidence.",
              },
              {
                n: "04",
                t: "Roast",
                d: "The engine reads your crimes back to you. Instant page now, video when it renders.",
              },
            ].map((step, i) => (
              <li
                key={step.n}
                className={`rounded-[20px] border-2 border-ink bg-paper p-6 shadow-brut ${
                  i % 2 === 0 ? "lg:tilt-l" : "lg:tilt-r"
                } transition-transform lg:hover:rotate-0`}
              >
                <div className="font-display text-4xl font-bold text-pop">
                  {step.n}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold uppercase">
                  {step.t}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ash">
                  {step.d}
                </p>
              </li>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ------------------------------------------------- WHO GETS ROASTED */}
      <section className="bg-grid-paper border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display font-bold uppercase text-huge">
              Who is this <span className="italic text-pop">for?</span>
            </h2>
            <StickerLabel tilt="l" className="mt-4">
              Statistically: you.
            </StickerLabel>
          </Reveal>

          <RevealGroup y={30} stagger={0.12} className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[24px] border-2 border-ink bg-pop p-8 text-paper shadow-brut">
              <BlobFlower
                aria-hidden
                className="absolute -right-8 -top-8 h-28 w-28 text-sun"
              />
              <h3 className="font-display text-4xl font-bold uppercase leading-none text-sun">
                Side-project
                <br />
                graveyards
              </h3>
              <p className="mt-4 max-w-sm font-sans text-base font-bold leading-snug">
                Fourteen repos, zero users, one dream. Getting roasted is the
                most attention your project will ever receive. Take it.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border-2 border-ink bg-grape p-8 text-paper shadow-brut">
              <Starburst
                aria-hidden
                className="absolute -right-6 -top-6 h-24 w-24 text-candy"
              />
              <h3 className="font-display text-4xl font-bold uppercase leading-none text-sun">
                AI wrapper
                <br />
                factories
              </h3>
              <p className="mt-4 max-w-sm font-sans text-base font-bold leading-snug">
                One prompt, one API call, one $49/month pricing page. The
                Originality Agent has receipts, and they are all the same app.
              </p>
            </div>
          </RevealGroup>
        </div>
      </section>

      {/* ------------------------------------------------------------ KISSIES */}
      <Kissies entries={entries} />

      {/* ------------------------------------------------------------- FAQ */}
      <section id="faq" className="bg-grid-paper scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="font-display font-bold uppercase text-huge">
              Questions you
              <br />
              should have asked
            </h2>
            <StickerLabel tilt="r" className="mt-4">
              Fair, honestly.
            </StickerLabel>
          </Reveal>
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="border-t-2 border-ink bg-sun text-ink">
        <Reveal y={28} className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-4xl font-display font-bold uppercase text-huge">
            Your repo is already slop.
            <br />
            Might as well rank.
          </h2>
          <div className="mx-auto mt-10 max-w-xl">
            <Link
              href="/submit"
              className="press inline-flex items-center gap-3 rounded-full border-2 border-ink bg-ink px-8 py-4 font-display text-lg font-bold uppercase tracking-widest text-paper shadow-brut hover:bg-paper hover:text-ink"
            >
              Submit your repo
              <span className="rounded-full bg-sun px-2 py-0.5 font-sans text-xs font-bold text-ink">
                takes 30s
              </span>
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
