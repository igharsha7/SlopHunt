"use client";

import { useState } from "react";

import { ChevronIcon } from "@/components/icons";

const FAQS = [
  {
    q: "Can I roast someone else's repo?",
    a: "No. Self-submission only. You sign in with GitHub and can only submit repos you own or collaborate on, or a repo carrying the roast-me topic. Without that rule this is a harassment tool, and we like it better as a comedy directory.",
  },
  {
    q: "Is the roast about me?",
    a: "Never. Deepak roasts the software — the commit messages, the dead demo link, the fourteen months of silence. There are no jokes about you, your identity, or your intelligence. The repo is the only target.",
  },
  {
    q: "How is the Slop Score calculated?",
    a: "Mostly deterministically, from dates, counts, and ratios — commit recency, TODO density, how many other products already do this. Two sub-scores (README Cope, Vibe Check) use LLM judgement. Higher means sloppier. Yes, you can argue with it. Arguing is engagement.",
  },
  {
    q: "What if my repo has a leaked secret?",
    a: "We flag that one was detected and we never store or display its value. Consider it a free security review with jokes. Then rotate the key. Today.",
  },
  {
    q: "Can I take my roast down?",
    a: "Instantly. If you submitted it, there's a delete button on the product page. No questions, no cooldown, hard delete.",
  },
  {
    q: "Where's the video?",
    a: "Rendering. The text roast and score appear in under thirty seconds; the video of the host reading your roast takes a few minutes and shows up on the page when it's done. The disappointment takes time.",
  },
];

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
                className="flex w-full items-center justify-between gap-4 px-1 py-6 text-left transition-colors hover:text-toxic"
              >
                <span className="font-display text-xl font-black uppercase tracking-tight sm:text-2xl">
                  {faq.q}
                </span>
                <ChevronIcon
                  className={`h-6 w-6 shrink-0 text-toxic transition-transform duration-200 ${
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
