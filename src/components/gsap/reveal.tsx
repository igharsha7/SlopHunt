"use client";

import { useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/**
 * Scroll-reveal primitives. Both are client shells that accept server-rendered
 * children, so pages stay RSC and only the choreography ships as JS.
 *
 * Content is visible by default (SSR/no-JS safe); the hide happens in a layout
 * effect right before first paint, then ScrollTrigger plays it back in.
 * Extra props (id, aria-*, role…) pass through, so these can stand in for any
 * semantic wrapper via `as`.
 */

type RevealBaseProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: ElementType;
};

export function Reveal({
  children,
  as: Tag = "div",
  y = 20,
  delay = 0,
  ...rest
}: RevealBaseProps & { y?: number; delay?: number }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.from(ref.current, {
        opacity: 0,
        y,
        delay,
        duration: 0.55,
        ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}

export function RevealGroup({
  children,
  as: Tag = "div",
  selector = ":scope > *",
  y = 26,
  stagger = 0.07,
  ...rest
}: RevealBaseProps & {
  /** Which descendants animate. Defaults to direct children. */
  selector?: string;
  y?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (prefersReducedMotion() || !root) return;
      const items = Array.from(root.querySelectorAll(selector));
      if (items.length === 0) return;

      gsap.set(items, { opacity: 0, y });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            // Long lists tighten the stagger so the tail never feels laggy.
            stagger: items.length > 10 ? Math.min(stagger, 0.04) : stagger,
          }),
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
