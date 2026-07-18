import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/gsap/reveal";
import { Faq } from "@/components/home/faq";
import { GitHubIcon } from "@/components/icons";
import { BlobFlower, StickerLabel } from "@/components/site/stickers";
import { REPO_URL } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "The rules of the roast: self-submission only, software never the person, instant deletes, secrets never shown.",
};

export default function FaqPage() {
  return (
    <div className="bg-grid-paper">
      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <BlobFlower
          aria-hidden
          className="pointer-events-none absolute -top-2 right-[4%] hidden h-20 w-20 text-candy md:block"
        />

        <Reveal>
          <h1 className="font-display font-bold uppercase text-mega">
            Fair
            <br />
            questions
          </h1>
          <StickerLabel tilt="r" className="mt-4">
            Asked before every roast. Answered once.
          </StickerLabel>
        </Reveal>

        <div className="mt-12">
          <Faq />
        </div>

        <Reveal className="mt-14 rounded-[24px] border-2 border-ink bg-cream p-7 shadow-brut">
          <h2 className="font-display text-2xl font-bold uppercase">
            Still suspicious?
          </h2>
          <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed text-ash">
            Good instinct. The whole thing is open source — the pipeline, the
            scoring math, the prompt that keeps Deepak polite about humans.
            Read it before you feed it.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-paper shadow-brut hover:bg-grape"
            >
              <GitHubIcon className="h-4 w-4" />
              Read the source
            </a>
            <Link
              href="/submit"
              className="press inline-flex items-center gap-2 rounded-full border border-ink bg-sun px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-ink shadow-brut hover:bg-sun-deep"
            >
              Get roasted
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
