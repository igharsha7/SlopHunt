"use client";

import { useEffect, useState } from "react";

/**
 * The byooooob hero move: a fixed line with one slot that cycles through a
 * list. Here the slot rotates through the crimes we're famous for finding.
 */
export function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, 1900);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className="relative inline-grid">
      {/* Invisible longest word reserves width so the layout never reflows. */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {words.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
      <span
        key={index}
        aria-live="polite"
        className="animate-rise col-start-1 row-start-1 rounded-md bg-sun px-2 text-ink"
      >
        {words[index]}
      </span>
    </span>
  );
}
