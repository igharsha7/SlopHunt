"use client";

import { useState } from "react";

import { ChevronIcon } from "@/components/icons";
import { FAQS } from "@/lib/faq-content";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y-2 divide-hairline border-y-2 border-hairline">
      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <li key={faq.q}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-1 py-6 text-left transition-colors hover:text-pop"
              >
                <span className="font-display text-xl font-black uppercase tracking-tight sm:text-2xl">
                  {faq.q}
                </span>
                <ChevronIcon                  className={`h-6 w-6 shrink-0 text-pop transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </h3>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl px-1 pb-6 text-base leading-relaxed text-ash">
                  {faq.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
