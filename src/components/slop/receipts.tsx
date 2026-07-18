import { RevealGroup } from "@/components/gsap/reveal";
import { ExternalIcon } from "@/components/icons";
import type { Receipt } from "@/lib/slop";

/** "Already Exists" receipts — the most brutal and most useful feature. */
export function Receipts({ receipts }: { receipts: Receipt[] }) {
  if (receipts.length === 0) return null;

  return (
    <section aria-labelledby="receipts-heading">
      <h2
        id="receipts-heading"
        className="font-display text-big font-black uppercase"
      >
        You could have just used
      </h2>
      <p className="mt-2 text-sm text-ash">
        Real, still-maintained software that already does this. Found by the
        Originality Agent, not made up.
      </p>
      <RevealGroup
        y={24}
        stagger={0.09}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {receipts.map((receipt) => (
          <a
            key={receipt.url}
            href={receipt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="press group flex flex-col rounded-[20px] border-2 border-ink bg-cream p-5 hover:border-pop hover:bg-paper"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-lg font-black uppercase tracking-tight group-hover:text-pop">
                {receipt.name}
              </span>
              <ExternalIcon className="h-4 w-4 shrink-0 text-ash-dim group-hover:text-pop" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              {receipt.description}
            </p>
          </a>
        ))}
      </RevealGroup>
    </section>
  );
}
