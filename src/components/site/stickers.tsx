import type { SVGProps } from "react";

/**
 * byooooob's floating sticker vocabulary, redrawn for SlopHunt. All inline
 * SVG, all decorative (aria-hidden), positioned by the parent.
 */

/** The pink pill with cartoon eyes that sits inline in their headline. */
export function EyesSticker({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center gap-[0.12em] rounded-[0.3em] border-2 border-ink bg-candy px-[0.22em] align-[-0.05em] ${className}`}
      style={{ height: "0.78em", width: "1.5em" }}
    >
      <span className="relative block aspect-square h-[68%] overflow-hidden rounded-full bg-paper">
        <span className="animate-eyes absolute inset-0 flex items-center justify-center">
          <span className="block aspect-square h-[55%] rounded-full bg-ink" />
        </span>
      </span>
      <span className="relative block aspect-square h-[68%] overflow-hidden rounded-full bg-paper">
        <span className="animate-eyes absolute inset-0 flex items-center justify-center">
          <span className="block aspect-square h-[55%] rounded-full bg-ink" />
        </span>
      </span>
    </span>
  );
}

export function Starburst(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden {...props}>
      <path
        d="M50 4l7 18 14-13-2 19 19-6-10 17 20 2-16 11 16 11-20 2 10 17-19-6 2 19-14-13-7 18-7-18-14 13 2-19-19 6 10-17-20-2 16-11-16-11 20-2-10-17 19 6-2-19 14 13z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BlobFlower(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden {...props}>
      <path d="M50 6c8 0 13 7 13 14 6-4 15-3 19 3 5 6 3 14-2 19 7 2 12 8 12 15s-5 13-12 15c5 5 7 13 2 19-4 6-13 7-19 3 0 7-5 14-13 14s-13-7-13-14c-6 4-15 3-19-3-5-6-3-14 2-19-7-2-12-8-12-15s5-13 12-15c-5-5-7-13-2-19 4-6 13-7 19-3 0-7 5-14 13-14z" />
    </svg>
  );
}

export function CursorArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...props}>
      <path
        d="M18 10l64 34-28 7 16 30-14 7-16-30-20 22z"
        fill="currentColor"
        stroke="#000"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tilted yellow label — their "Well, funny you should ask!" chip. */
export function StickerLabel({
  children,
  tilt = "l",
  className = "",
}: {
  children: React.ReactNode;
  tilt?: "l" | "r";
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-sun px-3 py-1 font-sans text-sm font-bold text-ink shadow-brut-sm ${
        tilt === "l" ? "tilt-l" : "tilt-r"
      } ${className}`}
    >
      {children}
    </span>
  );
}
