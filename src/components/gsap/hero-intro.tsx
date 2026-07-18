"use client";

import { useRef, type ReactNode } from "react";

import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/**
 * Entrance choreography for the hero. Targets data attributes on the
 * server-rendered children so the copy itself never leaves RSC:
 *
 *   data-hero-chip   — the live-stats pill
 *   data-hero-line   — each display headline line (staggered rise)
 *   data-hero-sub    — the subheadline
 *   data-hero-submit — the submit box
 *   data-hero-checks — container whose children stagger in last
 */
export function HeroIntro({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-chip]", { y: 14, opacity: 0, duration: 0.45 })
        .from(
          "[data-hero-line]",
          { y: 56, opacity: 0, duration: 0.7, stagger: 0.1 },
          "-=0.2",
        )
        .from("[data-hero-sub]", { y: 18, opacity: 0, duration: 0.5 }, "-=0.35")
        .from("[data-hero-submit]", { y: 18, opacity: 0, duration: 0.5 }, "-=0.3")
        .from(
          "[data-hero-checks] > *",
          { y: 12, opacity: 0, duration: 0.35, stagger: 0.07 },
          "-=0.25",
        );
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
