"use client";

import { useRef } from "react";

import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import {
  BREAKDOWN_LABELS,
  scoreColor,
  scoreBg,
  scoreVerdict,
  type Breakdown,
} from "@/lib/slop";

/**
 * The big Slop Score reveal + five labelled sub-score bars.
 *
 * The number counts up and the bars fill when the card scrolls into view —
 * this is the screenshot moment, so it gets the most deliberate animation on
 * the site. Server HTML carries the final values; the layout effect rewinds to
 * zero in the same frame it arms the timeline, so crawlers and no-JS visitors
 * always see the real score.
 */
export function ScoreCard({
  score,
  breakdown,
}: {
  score: number;
  breakdown: Breakdown;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const numberEl = numberRef.current;
      if (prefersReducedMotion() || !root || !numberEl) return;

      const counter = { value: 0 };
      const bars = gsap.utils.toArray<HTMLElement>("[data-score-bar]");

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
      });

      // Rewind visuals only now that the timeline exists (pre-paint).
      numberEl.textContent = "0";
      tl.to(counter, {
        value: score,
        duration: 1.2,
        ease: "power3.out",
        onUpdate: () => {
          numberEl.textContent = String(Math.round(counter.value));
        },
      }).fromTo(
        bars,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.65, ease: "power2.out", stagger: 0.08 },
        "-=0.9",
      );
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="overflow-hidden rounded-[20px] border-2 border-ink bg-cream shadow-brut">
      <div className="border-b-2 border-ink p-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-black uppercase tracking-widest text-ash">
            Slop Score
          </span>
          <span
            className={`font-display text-xs font-black uppercase tracking-widest ${scoreColor(
              score,
            )}`}
          >
            {scoreVerdict(score)}
          </span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span
            ref={numberRef}
            className={`tabular font-display text-8xl font-black leading-none ${scoreColor(
              score,
            )}`}
          >
            {score}
          </span>
          <span className="mb-2 font-display text-2xl font-black text-ash-dim">
            /100
          </span>
        </div>
      </div>

      <dl className="divide-y divide-hairline">
        {BREAKDOWN_LABELS.map(({ key, label, blurb }) => {
          const value = breakdown[key];
          return (
            <div key={key} className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="font-display text-sm font-black uppercase tracking-tight">
                  {label}
                </dt>
                <dd
                  className={`tabular font-display text-lg font-black ${scoreColor(
                    value,
                  )}`}
                >
                  {value}
                </dd>
              </div>
              <div
                className="mt-2 h-2 w-full border border-hairline bg-paper"
                role="meter"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
              >
                <div
                  data-score-bar
                  className={`h-full ${scoreBg(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ash-dim">{blurb}</p>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
