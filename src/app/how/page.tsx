import type { Metadata } from "next";
import Link from "next/link";

import { Reveal, RevealGroup } from "@/components/gsap/reveal";
import { SubmitBox } from "@/components/home/submit-box";
import { CheckIcon, GitHubIcon, SkullIcon } from "@/components/icons";
import {
  BlobFlower,
  CursorArrow,
  EyesSticker,
  Starburst,
  StickerLabel,
} from "@/components/site/stickers";
import { ScoreCard } from "@/components/slop/score-card";
import { VideoSlot } from "@/components/slop/video-slot";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Four agents, one verdict. How SlopHunt turns your repo URL into a Slop Score, a crimes list, and a video roast.",
};

/**
 * We ran the pipeline on ourselves before anyone else — the meta-joke is the
 * trust beat. A Product Hunt clone scoring low on originality is the point.
 */
const OUR_OWN_SCORE = {
  score: 32,
  breakdown: {
    originality: 61,
    abandonment: 4,
    readmeCope: 22,
    commitPoetry: 31,
    vibeCheck: 44,
  },
};

const CRAWL_AGENTS = [
  {
    name: "Repo crawler",
    reads: "README, last 100 commits, languages, file tree, branches",
    finds: '"final final v2", 41 TODOs, node_modules in version control',
  },
  {
    name: "Site crawler",
    reads: "Your homepage, if the README dares to link one",
    finds: "Screenshots, OG tags — or the 404 where a demo should be",
  },
  {
    name: "Originality agent",
    reads: "The web and GitHub, searching for your pitch",
    finds: "The 2–3 products that already exist. With links.",
  },
];

const RULES = [
  {
    rule: "Every joke cites evidence",
    detail:
      "No crime in the crawl data, no joke. Generic snark gets rejected and rewritten.",
  },
  {
    rule: "The software, never the person",
    detail:
      "Deepak is disappointed in the repo. Your identity, background, and intelligence are off the table. Hard rule, enforced in the prompt.",
  },
  {
    rule: "Self-submission only",
    detail:
      "You roast repos you own or collaborate on, or repos tagged roast-me. Nobody gets dragged here.",
  },
  {
    rule: "Delete means delete",
    detail:
      "One button on your page, instant hard delete, no questions, no cooldown.",
  },
  {
    rule: "Secrets get flagged, never shown",
    detail:
      "If the crawler finds a leaked key, we tell you one exists and score it. The value is never stored or displayed.",
  },
];

export default function HowPage() {
  return (
    <>
      {/* ------------------------------------------------------------- HERO */}
      <section className="bg-grid-paper relative overflow-hidden border-b-2 border-ink">
        <Starburst
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-12 hidden h-24 w-24 text-ink md:block"
        />
        <BlobFlower
          aria-hidden
          className="pointer-events-none absolute bottom-10 left-[3%] hidden h-20 w-20 text-grape md:block"
        />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <Reveal>
            <h1 className="max-w-4xl font-display font-bold uppercase text-mega">
              How the roast <EyesSticker /> gets made
            </h1>
            <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-ash sm:text-lg">
              You paste a URL. Four agents read everything you hoped nobody
              would. About thirty seconds later there is a score, a crimes
              list, and a page you did not ask for.
            </p>
            <StickerLabel tilt="l" className="mt-5">
              We ran it on ourselves first. Scroll down.
            </StickerLabel>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- 01 INTAKE (PURPLE) */}
      <section className="bg-rays-grape border-b-2 border-ink text-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="font-display text-xl font-bold uppercase tracking-widest text-sun">
              Step 01
            </p>
            <h2 className="mt-2 font-display font-bold uppercase text-huge">
              The gate
            </h2>
            <p className="mt-5 max-w-md font-sans text-lg font-bold leading-snug">
              Sign in with GitHub and submit a repo you own — or tag any repo
              with the <span className="text-sun">roast-me</span> topic. That
              consent check is the whole gate. No strangers get roasted,
              ever.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="tilt-r mx-auto w-full max-w-sm rounded-[24px] border-2 border-ink bg-paper p-6 text-ink shadow-brut transition-transform hover:rotate-0">
              <div className="flex items-center gap-2 font-display text-lg font-bold uppercase">
                <GitHubIcon className="h-5 w-5" />
                Ownership check
              </div>
              <ul className="mt-4 space-y-3 font-sans text-sm">
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-alive" />
                  <span>
                    <strong>you/your-regret</strong> — collaborator ✓
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-alive" />
                  <span>
                    topic <strong>roast-me</strong> present ✓
                  </span>
                </li>
                <li className="flex items-start gap-2 text-ash">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-center font-bold text-pop">
                    ✕
                  </span>
                  <span>someone else&apos;s repo — rejected</span>
                </li>
              </ul>
              <p className="mt-4 rounded-[12px] bg-sun-wash p-3 font-sans text-xs font-bold uppercase tracking-wider">
                Private repos never enter the pipeline
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------- 02 CRAWL (PINK) */}
      <section className="bg-grid-candy border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <p className="font-display text-xl font-bold uppercase tracking-widest text-grape">
              Step 02
            </p>
            <h2 className="mt-2 font-display font-bold uppercase text-huge">
              Three agents, at once
            </h2>
            <StickerLabel tilt="r" className="mt-4">
              Parallel. That&apos;s why it&apos;s fast.
            </StickerLabel>
          </Reveal>

          {/* Side-by-side layout = the parallelism, not decoration. */}
          <RevealGroup
            y={30}
            stagger={0.1}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            {CRAWL_AGENTS.map((agent, i) => (
              <div
                key={agent.name}
                className={`rounded-[20px] border-2 border-ink bg-paper p-6 shadow-brut ${
                  i === 1 ? "md:tilt-r" : "md:tilt-l"
                } transition-transform md:hover:rotate-0`}
              >
                <h3 className="font-display text-2xl font-bold uppercase">
                  {agent.name}
                </h3>
                <p className="mt-3 font-sans text-xs font-bold uppercase tracking-widest text-ash">
                  Reads
                </p>
                <p className="mt-1 font-sans text-sm leading-snug">
                  {agent.reads}
                </p>
                <p className="mt-3 font-sans text-xs font-bold uppercase tracking-widest text-pop">
                  Finds
                </p>
                <p className="mt-1 font-sans text-sm font-bold leading-snug">
                  {agent.finds}
                </p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* -------------------------------------------------- 03 SCORE (GRAY) */}
      <section className="bg-grid-paper border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="font-display text-xl font-bold uppercase tracking-widest text-pop">
              Step 03
            </p>
            <h2 className="mt-2 font-display font-bold uppercase text-huge">
              The score
            </h2>
            <p className="mt-5 max-w-md font-sans text-base leading-relaxed text-ash">
              Five sub-scores, equally weighted, mostly computed from cold
              hard dates and counts — so you can argue with the number, and
              the number can win. Higher is sloppier.
            </p>
            <p className="mt-4 max-w-md font-sans text-base font-bold leading-snug text-ink">
              This card is real: we ran the pipeline on SlopHunt itself. A
              Product Hunt clone was never going to ace originality.
            </p>
            <StickerLabel tilt="l" className="mt-5">
              32/100 — &ldquo;annoyingly good&rdquo;. For now.
            </StickerLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mx-auto w-full max-w-md">
              <ScoreCard
                score={OUR_OWN_SCORE.score}
                breakdown={OUR_OWN_SCORE.breakdown}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------- 04 ROAST + RULES (GRAPE) */}
      <section className="bg-zigzag-grape border-b-2 border-ink text-paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <p className="font-display text-xl font-bold uppercase tracking-widest text-sun">
              Step 04
            </p>
            <h2 className="mt-2 font-display font-bold uppercase text-huge">
              Deepak reads
              <br />
              your crimes
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0">
              <Reveal className="rounded-[24px] border-2 border-ink bg-paper p-7 text-ink shadow-brut">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-candy">
                    <SkullIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold uppercase">
                      Deepak from Code Review
                    </p>
                    <p className="font-sans text-xs uppercase tracking-widest text-ash">
                      40,000 PRs reviewed. Believed in software once.
                    </p>
                  </div>
                </div>
                <blockquote className="mt-5 border-l-4 border-pop pl-5 font-sans text-lg font-bold leading-snug">
                  &ldquo;The README says blazingly fast. The demo link says
                  404. One of you is lying, and I have the commit history, so
                  I know which.&rdquo;
                </blockquote>
                <p className="mt-4 font-sans text-sm text-ash">
                  The text roast and score land instantly. The video of Deepak
                  reading it renders in the background and attaches to your
                  page when it&apos;s done.
                </p>
              </Reveal>

              <RevealGroup as="ul" y={18} stagger={0.07} className="mt-10">
                {RULES.map((item) => (
                  <li
                    key={item.rule}
                    className="border-t border-paper/25 py-5"
                  >
                    <p className="font-display text-xl font-bold uppercase text-sun">
                      {item.rule}
                    </p>
                    <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-paper/90">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </RevealGroup>
            </div>

            <Reveal delay={0.15} className="mx-auto w-full max-w-[280px] lg:mx-0">
              <VideoSlot status="rendering" url={null} repoName="your repo" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-sun text-ink">
        <CursorArrow
          aria-hidden
          className="pointer-events-none absolute right-[8%] top-10 hidden h-12 w-12 text-grape md:block"
        />
        <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display font-bold uppercase text-huge">
            Seen enough?
          </h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-base font-bold">
            Paste it. The agents do the rest, and the leaderboard does the
            remembering.
          </p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <SubmitBox />
          </div>
          <p className="mt-6 font-sans text-xs uppercase tracking-widest text-ink/60">
            Or just{" "}
            <Link href="/leaderboard" className="underline hover:text-grape">
              watch others suffer
            </Link>
          </p>
        </Reveal>
      </section>
    </>
  );
}
