"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/**
 * 2px sun progress bar pinned above the nav — how deep into the slop you are.
 * Scroll-linked (moves only when the user scrolls), skipped under
 * reduced motion anyway since it's decorative.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    if (prefersReducedMotion() || !barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.4 },
      },
    );
  });

  // Route changes swap the page height out from under every trigger.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed inset-x-0 top-0 z-[120] h-[3px] origin-left scale-x-0 bg-pop"
    />
  );
}
