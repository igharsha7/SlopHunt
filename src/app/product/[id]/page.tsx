import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/gsap/reveal";
import {
  ArrowIcon,
  ExternalIcon,
  GitHubIcon,
  StarIcon,
} from "@/components/icons";
import { CrimesReport } from "@/components/slop/crimes-report";
import { Receipts } from "@/components/slop/receipts";
import { ScoreCard } from "@/components/slop/score-card";
import { ShareButton } from "@/components/slop/share-button";
import { SkullButton } from "@/components/slop/skull-button";
import { VideoSlot } from "@/components/slop/video-slot";
import { getAllSlugs, getEntry } from "@/lib/queries";
import { relativeTime, scoreVerdict } from "@/lib/slop";

type Params = { id: string };

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ id: encodeURIComponent(slug) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) return { title: "Not found" };

  const ogImage = `/product/${entry.slug}/opengraph-image`;
  return {
    title: `${entry.name} — Slop Score ${entry.slopScore}`,
    description: entry.oneLiner,
    openGraph: {
      title: `${entry.name} scored ${entry.slopScore}/100`,
      description: entry.oneLiner,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.name} scored ${entry.slopScore}/100`,
      description: entry.oneLiner,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) notFound();

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-ash-dim hover:text-pop"
      >
        <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
        Leaderboard
      </Link>

      {/* ------------------------------------------------------------ HEADER */}
      <header className="mt-6 border-b-2 border-hairline pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-display font-black uppercase text-huge">
                {entry.name}
              </h1>
              <span className="rounded-full border-2 border-pop px-3 py-1 font-display text-xs font-black uppercase tracking-widest text-pop">
                {scoreVerdict(entry.slopScore)}
              </span>
            </div>
            <p className="mt-3 max-w-2xl font-sans text-lg text-ash">
              {entry.tagline}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-widest text-ash-dim">
              <span className="text-ash">@{entry.owner}</span>
              {entry.primaryLang ? <span>{entry.primaryLang}</span> : null}
              <span className="inline-flex items-center gap-1">
                <StarIcon className="h-3 w-3" /> {entry.stars}
              </span>
              <span>last commit {relativeTime(entry.lastCommit)}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {entry.topics.map((topic) => (
                <Link
                  key={topic}
                  href={`/leaderboard?tag=${topic}`}
                  className="press rounded-full border-2 border-ink px-3 py-1 text-xs lowercase text-ash hover:border-pop hover:text-pop"
                >
                  #{topic}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href={entry.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-display text-sm font-black uppercase tracking-widest hover:bg-cream"
              >
                <GitHubIcon className="h-4 w-4" /> Repo
              </a>
              {entry.homepageUrl ? (
                <a
                  href={entry.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-display text-sm font-black uppercase tracking-widest hover:bg-cream"
                >
                  <ExternalIcon className="h-4 w-4" /> Site
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <SkullButton
              entryId={entry.id}
              initialCount={entry.skulls}
              size="lg"
            />
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- MAIN GRID */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* LEFT: screenshot, roast, receipts, crimes */}
        <div className="min-w-0 space-y-12">
          {/* Screenshot / fallback */}
          <div className="overflow-hidden rounded-[20px] border-2 border-ink bg-cream">
            {entry.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.screenshotUrl}
                alt={`Screenshot of ${entry.name}`}
                className="w-full"
              />
            ) : (
              <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 p-8 text-center">
                <span className="font-display text-2xl font-black uppercase text-ash-dim">
                  No live site
                </span>
                <span className="text-xs uppercase tracking-widest text-ash-dim">
                  {entry.homepageUrl
                    ? "The demo link returned a 404"
                    : "Nothing to screenshot. Nothing was shipped."}
                </span>
              </div>
            )}
          </div>

          {/* The roast */}
          <Reveal as="section" aria-labelledby="roast-heading">
            <h2
              id="roast-heading"
              className="font-display text-big font-black uppercase"
            >
              The Roast
            </h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-ash-dim">
              As read by Deepak, who reviewed 40,000 PRs and believed in software
              once
            </p>
            <div className="mt-5 space-y-4 border-l-4 border-pop pl-5">
              {entry.pageRoast.split("\n\n").map((para, i) => (
                <p key={i} className="font-sans leading-relaxed text-ink">
                  {para}
                </p>
              ))}
            </div>
          </Reveal>

          <Receipts receipts={entry.receipts} />

          <CrimesReport crimes={entry.crimes} />

          <div className="border-t-2 border-hairline pt-6">
            <ShareButton
              slug={entry.slug}
              name={entry.name}
              score={entry.slopScore}
              oneLiner={entry.oneLiner}
            />
          </div>
        </div>

        {/* RIGHT: score card + video (sticky on desktop) */}
        <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
          <ScoreCard score={entry.slopScore} breakdown={entry.breakdown} />

          <div>
            <h2 className="mb-4 font-display text-sm font-black uppercase tracking-widest text-ash">
              Video Roast
            </h2>
            <VideoSlot
              status={entry.video.status}
              url={entry.video.url}
              repoName={entry.name}
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
