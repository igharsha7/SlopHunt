"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

import { SkullIcon } from "@/components/icons";
import { sendReaction } from "@/lib/backend";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * The 💀 reaction — SlopHunt's upvote. One per visitor, throttled client-side
 * with localStorage (server-side IP throttle is a later phase). Optimistic: the
 * count moves the instant you click, because dopamine is the product.
 *
 * State lives in localStorage and is read through useSyncExternalStore, which
 * is the hydration-safe way to surface a client-only store — the server
 * snapshot is always `false`, so the first render matches the SSR'd HTML and
 * there's no setState-in-effect cascade.
 */

const EVENT = "slop:skull-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function SkullButton({
  entryId,
  initialCount,
  size = "md",
}: {
  entryId: string;
  initialCount: number;
  size?: "sm" | "md" | "lg";
}) {
  const key = `slop:skull:${entryId}`;

  const reacted = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => false,
  );

  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => {
    const giving = localStorage.getItem(key) !== "1";
    if (giving) {
      localStorage.setItem(key, "1");
    } else {
      localStorage.removeItem(key);
    }
    // Same-tab listeners don't get the native `storage` event — fire our own.
    window.dispatchEvent(new Event(EVENT));

    // Juice: a punch when the skull lands, a small dip when it's taken back.
    if (!prefersReducedMotion() && buttonRef.current) {
      gsap.killTweensOf(buttonRef.current);
      gsap.fromTo(
        buttonRef.current,
        { scale: giving ? 0.9 : 0.96 },
        {
          scale: 1,
          duration: giving ? 0.5 : 0.25,
          ease: giving ? "elastic.out(1.2, 0.45)" : "power2.out",
        },
      );
    }

    // Persist server-side. Fire-and-forget: the optimistic UI already moved,
    // and a failed write just means the count reconciles on next load.
    let fingerprint = localStorage.getItem("slop:fingerprint");
    if (!fingerprint) {
      fingerprint = crypto.randomUUID();
      localStorage.setItem("slop:fingerprint", fingerprint);
    }
    // Routes to the tunnelled backend when configured, else the in-app route.
    void sendReaction(entryId, fingerprint, giving);
  }, [key, entryId]);

  // initialCount is the stored total; this visitor's own skull is layered on top.
  const count = initialCount + (reacted ? 1 : 0);

  const pad =
    size === "lg" ? "px-5 py-4 text-xl" : size === "sm" ? "px-2.5 py-2 text-sm" : "px-3 py-2.5";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-pressed={reacted}
      aria-label={reacted ? "Remove your skull" : "Give this repo a skull"}
      className={`press flex flex-col items-center justify-center gap-1 rounded-[14px] border-2 font-display font-black leading-none ${pad} ${
        reacted
          ? "border-ink bg-candy text-ink"
          : "border-ink bg-paper text-ink hover:border-pop hover:text-pop"
      }`}
    >
      <SkullIcon className={icon} />
      <span className="tabular text-xs">{count.toLocaleString()}</span>
    </button>
  );
}
