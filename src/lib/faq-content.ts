export const FAQS = [
  {
    q: "Can I roast someone else's repo?",
    a: "No. Self-submission only. You sign in with GitHub and can only submit repos you own, or any repo carrying the roast-me topic. Without that rule this is a harassment tool, and we like it better as a comedy directory.",
  },
  {
    q: "Is the roast about me?",
    a: "Never. SlopHunt roasts the software — the commit messages, the dead demo link, the fourteen months of silence. There are no jokes about you, your identity, or your intelligence. The repo is the only target.",
  },
  {
    q: "How is the Slop Score calculated?",
    a: "Mostly deterministically, from dates, counts, and ratios — commit recency, TODO density, how many other products already do this. Higher means sloppier. Yes, you can argue with it. Arguing is engagement.",
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
  {
    q: "Is SlopHunt open source?",
    a: "Fully. The whole site — pipeline, scoring, this FAQ — lives in a public repo. Star it, fork it, or submit it to itself. We already did: it scored 32.",
  },
] as const;

/**
 * Public repo for the "open source — star it" links.
 *
 * Must point at a PUBLIC repo: a private one 404s for every visitor, which is
 * worse than having no link. Override with NEXT_PUBLIC_REPO_URL.
 */
export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/igharsha7/SlopHunt";
