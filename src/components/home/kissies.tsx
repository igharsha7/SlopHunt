import { SkullIcon } from "@/components/icons";

/**
 * byooooob's "kissies FROM OUR PARTNERS" card stack, from the other side of
 * the roast: what the owners said afterwards. Fictional handles, same rule as
 * the demo data — nobody real gets quoted without submitting.
 */
const KISSIES = [
  {
    handle: "@quietfox",
    repo: "notion-but-worse",
    quote:
      "Accurate, unfortunately. I have printed the crimes list and taped it above my desk.",
  },
  {
    handle: "@sableghost",
    repo: "yet-another-state-lib",
    quote:
      "It complimented my commit messages before destroying me. Ten out of ten, would be roasted again.",
  },
  {
    handle: "@grimwattle",
    repo: "dotfiles",
    quote:
      "It found the revert of the revert of the revert. Nobody has ever looked at me like that.",
  },
];

export function Kissies() {
  return (
    <section className="bg-zigzag-grape border-y-2 border-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display font-bold uppercase text-huge">
          <span className="text-sun">Kissies</span>{" "}
          <span className="italic">from the roasted</span>
        </h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {KISSIES.map((kiss, i) => (
            <figure
              key={kiss.handle}
              className={`rounded-[24px] border-2 border-ink bg-paper p-7 text-ink shadow-brut ${
                i % 2 === 0 ? "tilt-l" : "tilt-r"
              } transition-transform hover:rotate-0`}
            >
              <figcaption className="flex items-center gap-2 font-display text-lg font-bold uppercase">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-candy">
                  <SkullIcon className="h-4 w-4" />
                </span>
                {kiss.handle}
              </figcaption>
              <blockquote className="mt-4 font-sans text-lg font-bold leading-snug">
                &ldquo;{kiss.quote}&rdquo;
              </blockquote>
              <p className="mt-4 font-sans text-xs uppercase tracking-widest text-ash">
                roasted for {kiss.repo}
              </p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
