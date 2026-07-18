/**
 * Endless horizontal type band, byooooob-style. Content is duplicated so the
 * -50% translate loops seamlessly; the copy is aria-hidden to avoid a screen
 * reader announcing every phrase twice.
 */
export function Marquee({
  items,
  reverse = false,
  duration = 32,
  className = "",
}: {
  items: string[];
  reverse?: boolean;
  duration?: number;
  className?: string;
}) {
  const track = [...items, ...items];

  return (
    <div
      className={`pause-on-hover flex overflow-hidden ${className}`}
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
    >
      <ul
        aria-hidden
        className={`flex shrink-0 items-center ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {track.map((item, i) => (
          <li key={i} className="flex items-center whitespace-nowrap">
            <span className="px-6 font-display text-2xl font-black uppercase tracking-tight sm:text-4xl">
              {item}
            </span>
            <span aria-hidden className="text-pop">
              ✦
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
