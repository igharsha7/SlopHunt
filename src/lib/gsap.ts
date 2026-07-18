"use client";

/**
 * Single GSAP entry point. Every animated component imports from here so the
 * plugin registration happens exactly once and SSR stays safe (registration is
 * window-guarded; imports alone are inert on the server).
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * CSS kills its own animations under prefers-reduced-motion, but GSAP writes
 * inline styles — every timeline must check this and bail to final states.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export { gsap, ScrollTrigger, useGSAP };
