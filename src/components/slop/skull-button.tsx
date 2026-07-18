"use client";

import { useCallback, useSyncExternalStore } from "react";

import { SkullIcon } from "@/components/icons";

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

  const toggle = useCallback(() => {
    if (localStorage.getItem(key) === "1") {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, "1");
    }
    // Same-tab listeners don't get the native `storage` event — fire our own.
    window.dispatchEvent(new Event(EVENT));
    // TODO(phase-5): POST /api/react to persist with IP throttle.
  }, [key]);

  // initialCount is the stored total; this visitor's own skull is layered on top.
  const count = initialCount + (reacted ? 1 : 0);

  const pad =
    size === "lg" ? "px-5 py-4 text-xl" : size === "sm" ? "px-2.5 py-2 text-sm" : "px-3 py-2.5";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={reacted}
      aria-label={reacted ? "Remove your skull" : "Give this repo a skull"}
      className={`press flex flex-col items-center justify-center gap-1 border-2 font-display font-black leading-none ${pad} ${
        reacted
          ? "border-toxic bg-toxic text-void"
          : "border-hairline-2 bg-void text-bone hover:border-toxic hover:text-toxic"
      }`}
    >
      <SkullIcon className={icon} />
      <span className="tabular text-xs">{count.toLocaleString()}</span>
    </button>
  );
}
