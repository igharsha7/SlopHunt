"use client";

import { useEffect, useState } from "react";

/**
 * The byooooob hero move: a fixed line with one slot that cycles through a
 * list. Two looks:
 *  - "chip": small yellow highlight inside body copy
 *  - "display": the big purple headline word, exactly like their rotating
 *    STRATEGISTS / COPYWRITERS / … line
 */
export function RotatingWord({
  words,
  variant = "chip",
}: {
  words: string[];
  variant?: "chip" | "display";
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, 2100);
    return () => clearInterval(id);
  }, [words.length]);

  const face =
    variant === "display"
      ? "text-grape"
      : "rounded-md bg-sun px-2 text-ink";

  return (
    <span className="relative inline-grid">
      {/* Invisible longest word reserves width so the layout never reflows. */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {words.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
      <span
        key={index}
        aria-live="polite"
        className={`animate-rise col-start-1 row-start-1 whitespace-nowrap ${face}`}
      >
        {words[index]}
      </span>
    </span>
  );
}
