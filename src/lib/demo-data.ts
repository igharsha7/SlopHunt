import type { SlopEntry } from "./slop";

/**
 * Fixtures for local development and the empty-database case.
 *
 * Every repo here is INVENTED. Roasting a real stranger's repo without consent
 * is the exact thing safety rail 1 exists to prevent, and seeding the demo with
 * real handles would ship that violation on day one.
 */

const day = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * day).toISOString();

export const DEMO_ENTRIES: SlopEntry[] = [
  {
    id: "d1a0b2c3-0000-4000-8000-000000000001",
    slug: "quietfox--notion-but-worse",
    owner: "quietfox",
    name: "notion-but-worse",
    htmlUrl: "https://github.com/quietfox/notion-but-worse",
    homepageUrl: "https://notion-but-worse.vercel.app",
    tagline: "A note-taking app for people who hate both notes and taking them.",
    topics: ["productivity", "react", "notion", "roast-me"],
    stars: 34,
    primaryLang: "TypeScript",
    lastCommit: ago(430),
    slopScore: 96,
    breakdown: {
      originality: 99,
      abandonment: 97,
      readmeCope: 94,
      commitPoetry: 98,
      vibeCheck: 92,
    },
    skulls: 1284,
    oneLiner: "Fourteen months of silence is not a roadmap.",
    pageRoast:
      "The README opens with \"the last note-taking app you'll ever need,\" which is technically true, because you stopped using it in March of last year and so did everyone else. Six badges sit at the top. Four of them link to CI that has never run. The demo at notion-but-worse.vercel.app returns a 404 with the Vercel logo, which is the most honest part of this project.\n\nThe commit history reads like a hostage note. \"fix\", \"fix again\", \"ok actually fix\", and then, fourteen months ago, \"final final v2\" — the last thing anyone ever said here. There are 41 TODOs in a codebase of 2,100 lines. That is a TODO every fifty-one lines. You did not write software, you wrote a list of intentions with syntax highlighting.\n\nAlso, Notion exists. Obsidian exists. Logseq exists. All three still get commits.",
    crimes: [
      {
        category: "abandonment",
        evidence: 'Last commit: "final final v2" — 14 months ago',
        detail: "The three commits before it were all named 'fix'.",
      },
      {
        category: "readme_cope",
        evidence: '"The last note-taking app you\'ll ever need"',
        detail: "Accurate, but not in the way intended.",
      },
      {
        category: "readme_cope",
        evidence: "6 badges, 4 pointing at CI that has never executed",
      },
      {
        category: "vibe_check",
        evidence: "41 TODO comments across 2,100 lines of source",
        detail: "One unfulfilled promise every 51 lines.",
      },
      {
        category: "vibe_check",
        evidence: "Demo link in README returns 404",
        detail: "notion-but-worse.vercel.app has been down since the last deploy.",
      },
      {
        category: "commit_poetry",
        evidence: '17 of 100 commits are the single word "fix"',
      },
      {
        category: "originality",
        evidence: "Three receipts found, all still actively maintained",
      },
    ],
    receipts: [
      {
        name: "Notion",
        url: "https://www.notion.so",
        description: "The thing you named yourself after. Still shipping.",
      },
      {
        name: "Obsidian",
        url: "https://obsidian.md",
        description: "Local-first, plugin ecosystem, does not 404.",
      },
      {
        name: "Logseq",
        url: "https://logseq.com",
        description: "Open source, outliner-based, committed this week.",
      },
    ],
    video: { status: "ready", url: null },
    screenshotUrl: null,
    submittedAt: ago(0),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000002",
    slug: "hexdrifter--ai-resume-builder",
    owner: "hexdrifter",
    name: "ai-resume-builder",
    htmlUrl: "https://github.com/hexdrifter/ai-resume-builder",
    homepageUrl: null,
    tagline: "It's one API call in a trench coat asking for your credit card.",
    topics: ["ai", "gpt", "saas", "roast-me"],
    stars: 212,
    primaryLang: "Python",
    lastCommit: ago(96),
    slopScore: 93,
    breakdown: {
      originality: 100,
      abandonment: 71,
      readmeCope: 96,
      commitPoetry: 88,
      vibeCheck: 97,
    },
    skulls: 967,
    oneLiner: "You wrote a prompt and called it a platform.",
    pageRoast:
      "The README describes \"a multi-agent AI system with proprietary resume optimisation.\" The multi-agent AI system is one file, main.py, and it is 140 lines. Ninety of those lines are a prompt string. The proprietary optimisation is the sentence \"make this resume better\" concatenated onto the user's input.\n\nThe pricing section proposes three tiers, the highest at $49/month, for software that has no auth, no database, and no deploy target. There is a Stripe key in the committed .env.example — not a placeholder, a real-looking key shape. We did not store it and we are not displaying it, but you should rotate it. Today.\n\nAt least eight tools do this exact thing and several are free. Your differentiator is that you are asking for money.",
    crimes: [
      {
        category: "readme_cope",
        evidence: '"Multi-agent AI system with proprietary optimisation"',
        detail: "The system is main.py, 140 lines, 90 of which are a prompt.",
      },
      {
        category: "originality",
        evidence: "The entire product is one chat completion call",
      },
      {
        category: "vibe_check",
        evidence: "Possible leaked secret detected in committed .env.example",
        detail: "Value not stored or displayed. Rotate it anyway.",
      },
      {
        category: "readme_cope",
        evidence: "$49/month tier for software with no auth and no database",
      },
      {
        category: "commit_poetry",
        evidence: 'Commit: "asdf" (still in main, never amended)',
      },
      {
        category: "vibe_check",
        evidence: "node_modules committed — 12,400 files in version control",
      },
    ],
    receipts: [
      {
        name: "Teal",
        url: "https://www.tealhq.com",
        description: "Free AI resume builder with actual job tracking.",
      },
      {
        name: "Rezi",
        url: "https://www.rezi.ai",
        description: "Does this, has customers, has a database.",
      },
      {
        name: "Open Resume",
        url: "https://www.open-resume.com",
        description: "Open source, free, no $49 tier.",
      },
    ],
    video: { status: "rendering", url: null },
    screenshotUrl: null,
    submittedAt: ago(0),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000003",
    slug: "marrowlight--blockchain-todo",
    owner: "marrowlight",
    name: "blockchain-todo",
    htmlUrl: "https://github.com/marrowlight/blockchain-todo",
    homepageUrl: null,
    tagline: "Decentralised task management for a problem that was never centralised.",
    topics: ["blockchain", "web3", "solidity", "roast-me"],
    stars: 8,
    primaryLang: "Solidity",
    lastCommit: ago(1180),
    slopScore: 91,
    breakdown: {
      originality: 84,
      abandonment: 100,
      readmeCope: 89,
      commitPoetry: 93,
      vibeCheck: 88,
    },
    skulls: 743,
    oneLiner: "Every checkbox costs four dollars in gas. That is the product.",
    pageRoast:
      "Marking a task complete writes to the chain. At the gas prices in your own README's example, that is roughly $4.10 per checkbox. You have shipped the world's first to-do list with a marginal cost.\n\nThe last commit was three years and two months ago, titled \"wip\". It is still wip. The contract has a function called `deleteTask` that is marked `public` with no access control, so anyone can delete anyone's tasks — which, given that nothing is deployed, remains theoretical.\n\nThe README says \"trustless, permissionless, unstoppable.\" It has been stopped since 2022.",
    crimes: [
      {
        category: "abandonment",
        evidence: 'Last commit: "wip" — 3 years 2 months ago',
        detail: "It is, in fairness, still a work in progress.",
      },
      {
        category: "readme_cope",
        evidence: '"Trustless, permissionless, unstoppable"',
        detail: "Stopped in 2022.",
      },
      {
        category: "vibe_check",
        evidence: "deleteTask() is public with no access control",
      },
      {
        category: "originality",
        evidence: "Solves centralisation in an application with one user",
      },
      {
        category: "commit_poetry",
        evidence: '9 commits titled "wip", 0 titled anything else',
      },
    ],
    receipts: [
      {
        name: "Todoist",
        url: "https://todoist.com",
        description: "Free. Instant. Costs nothing per checkbox.",
      },
      {
        name: "A piece of paper",
        url: "https://en.wikipedia.org/wiki/Paper",
        description: "Trustless, permissionless, genuinely unstoppable.",
      },
    ],
    video: { status: "ready", url: null },
    screenshotUrl: null,
    submittedAt: ago(1),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000004",
    slug: "pixelvane--uber-for-laundry",
    owner: "pixelvane",
    name: "uber-for-laundry",
    htmlUrl: "https://github.com/pixelvane/uber-for-laundry",
    homepageUrl: "https://uberforlaundry.io",
    tagline: "Disrupting an industry that was already fine.",
    topics: ["startup", "marketplace", "nextjs"],
    stars: 61,
    primaryLang: "JavaScript",
    lastCommit: ago(215),
    slopScore: 84,
    breakdown: {
      originality: 92,
      abandonment: 83,
      readmeCope: 91,
      commitPoetry: 72,
      vibeCheck: 82,
    },
    skulls: 512,
    oneLiner: "The pitch deck is more finished than the product.",
    pageRoast:
      "There is a 24-slide pitch deck committed at the repo root. There is no backend. The deck contains a slide titled \"Path to $1B ARR.\" The `api/` directory contains a single file that returns `{ ok: true }`.\n\nThe landing page is genuinely well designed, which makes it worse — you spent the effort on the part that doesn't wash anything. Seven months since the last commit, and that commit was to the marketing copy.\n\nWashio tried this. It raised $16.8M and shut down. The README does not mention Washio.",
    crimes: [
      {
        category: "readme_cope",
        evidence: 'Committed pitch deck contains "Path to $1B ARR"',
        detail: "The api/ directory returns { ok: true } and nothing else.",
      },
      {
        category: "abandonment",
        evidence: "Last commit 7 months ago, to marketing copy",
      },
      {
        category: "originality",
        evidence: "Washio raised $16.8M for this exact idea and folded",
      },
      {
        category: "vibe_check",
        evidence: "Backend is one route handler returning a literal",
      },
    ],
    receipts: [
      {
        name: "Rinse",
        url: "https://www.rinse.com",
        description: "Same idea, operating, has actual vans.",
      },
      {
        name: "Washio (2013–2016)",
        url: "https://techcrunch.com",
        description: "Raised $16.8M. Shut down. Worth reading first.",
      },
    ],
    video: { status: "ready", url: null },
    screenshotUrl: null,
    submittedAt: ago(2),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000005",
    slug: "sableghost--yet-another-state-lib",
    owner: "sableghost",
    name: "yet-another-state-lib",
    htmlUrl: "https://github.com/sableghost/yet-another-state-lib",
    homepageUrl: null,
    tagline: "The sixteenth solution to a problem solved in 2015.",
    topics: ["react", "state-management", "javascript", "roast-me"],
    stars: 143,
    primaryLang: "TypeScript",
    lastCommit: ago(38),
    slopScore: 78,
    breakdown: {
      originality: 97,
      abandonment: 41,
      readmeCope: 86,
      commitPoetry: 64,
      vibeCheck: 71,
    },
    skulls: 388,
    oneLiner: "\"Only 2kb\" is not a reason for something to exist.",
    pageRoast:
      "The README's opening argument is that it is 2kb. That is the whole argument. Zustand is 1.1kb and has 47,000 stars, which the comparison table in your README omits — it compares against Redux, MobX, and Recoil, but not the one that would win.\n\nCredit where it is due: this is the only repo on this leaderboard with tests, and the commit messages are written by a human being. \"Handle stale closure in subscribe teardown\" is a real sentence describing a real bug. It brings the whole score down and you should feel good about that.\n\nBut the API is Zustand's API with different nouns. You did not build a library, you built a synonym.",
    crimes: [
      {
        category: "originality",
        evidence: "API surface is Zustand's, with renamed methods",
      },
      {
        category: "readme_cope",
        evidence: "Comparison table omits Zustand, the smaller competitor",
      },
      {
        category: "readme_cope",
        evidence: '"Only 2kb!" is the headline feature',
        detail: "Zustand is 1.1kb.",
      },
      {
        category: "vibe_check",
        evidence: "3 open issues, all asking why this exists",
      },
    ],
    receipts: [
      {
        name: "Zustand",
        url: "https://github.com/pmndrs/zustand",
        description: "1.1kb. Smaller than yours. 47k stars.",
      },
      {
        name: "Jotai",
        url: "https://jotai.org",
        description: "Atomic model, actively maintained.",
      },
      {
        name: "Valtio",
        url: "https://valtio.dev",
        description: "Proxy-based, also by the Zustand author.",
      },
    ],
    video: { status: "pending", url: null },
    screenshotUrl: null,
    submittedAt: ago(3),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000006",
    slug: "grimwattle--dotfiles",
    owner: "grimwattle",
    name: "dotfiles",
    htmlUrl: "https://github.com/grimwattle/dotfiles",
    homepageUrl: null,
    tagline: "487 commits of moving a config file between two folders.",
    topics: ["dotfiles", "vim", "shell"],
    stars: 4,
    primaryLang: "Lua",
    lastCommit: ago(4),
    slopScore: 71,
    breakdown: {
      originality: 58,
      abandonment: 8,
      readmeCope: 62,
      commitPoetry: 96,
      vibeCheck: 89,
    },
    skulls: 296,
    oneLiner: "You have committed 487 times and configured nothing.",
    pageRoast:
      "487 commits. Forty-one of them say \"update\". Thirty say \"tweak\". Twelve say \".\" — just a period. There is a commit from last Tuesday titled \"revert revert revert fix\", which reverts a revert of a revert.\n\nThe repo is extremely alive — you committed four days ago — and that is the problem. This is not a project, it is a coping mechanism with version control. Your Neovim config imports 34 plugins, six of which are alternative file explorers. You have configured three different fuzzy finders and bound all of them to different keys you do not remember.\n\nThe README is a single line: \"my dotfiles\". Finally, an honest README. Points for that.",
    crimes: [
      {
        category: "commit_poetry",
        evidence: '41 commits named "update", 12 named "."',
      },
      {
        category: "commit_poetry",
        evidence: 'Commit: "revert revert revert fix"',
        detail: "It reverts a revert of a revert.",
      },
      {
        category: "vibe_check",
        evidence: "34 Neovim plugins, 6 of which are file explorers",
      },
      {
        category: "vibe_check",
        evidence: "3 fuzzy finders bound to 3 different keybinds",
      },
      {
        category: "readme_cope",
        evidence: 'README is one line: "my dotfiles"',
        detail: "Genuinely accurate. Score reduced accordingly.",
      },
    ],
    receipts: [
      {
        name: "GNU Stow",
        url: "https://www.gnu.org/software/stow/",
        description: "Solves dotfile management in one command.",
      },
      {
        name: "chezmoi",
        url: "https://www.chezmoi.io",
        description: "Templating, secrets, multi-machine. Already built.",
      },
    ],
    video: { status: "ready", url: null },
    screenshotUrl: null,
    submittedAt: ago(4),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000007",
    slug: "novaquill--chatgpt-wrapper-9000",
    owner: "novaquill",
    name: "chatgpt-wrapper-9000",
    htmlUrl: "https://github.com/novaquill/chatgpt-wrapper-9000",
    homepageUrl: null,
    tagline: "The 9000 refers to how many of these exist.",
    topics: ["ai", "chatbot", "openai"],
    stars: 27,
    primaryLang: "Python",
    lastCommit: ago(302),
    slopScore: 88,
    breakdown: {
      originality: 100,
      abandonment: 89,
      readmeCope: 78,
      commitPoetry: 81,
      vibeCheck: 92,
    },
    skulls: 604,
    oneLiner: "Naming it 9000 was the most creative decision in the repo.",
    pageRoast:
      "The repo is a Flask app with one route that forwards a string to an API and returns the response. The README calls this \"an intelligent conversational framework.\" It is a proxy. You built a proxy and gave it a number.\n\nTen months since the last commit, which was titled \"update readme\" and changed one emoji. The `requirements.txt` pins openai==0.28, an SDK version deprecated so long ago that the code no longer runs against the current API. This project does not work. Not \"has bugs\" — the imports fail.\n\nThere is a `models/` directory containing no models. There is a `tests/` directory containing a file named `test.py` containing the word `pass`.",
    crimes: [
      {
        category: "originality",
        evidence: "One Flask route forwarding to an API, called a framework",
      },
      {
        category: "vibe_check",
        evidence: "requirements.txt pins openai==0.28 — imports now fail",
        detail: "The project does not run against the current SDK.",
      },
      {
        category: "vibe_check",
        evidence: "tests/test.py contains a single statement: pass",
      },
      {
        category: "vibe_check",
        evidence: "models/ directory is empty",
      },
      {
        category: "abandonment",
        evidence: 'Last commit: "update readme" — changed one emoji, 10mo ago',
      },
    ],
    receipts: [
      {
        name: "LibreChat",
        url: "https://github.com/danny-avila/LibreChat",
        description: "Multi-model, self-hosted, 20k stars, maintained.",
      },
      {
        name: "Open WebUI",
        url: "https://openwebui.com",
        description: "The thing people actually install for this.",
      },
    ],
    video: { status: "ready", url: null },
    screenshotUrl: null,
    submittedAt: ago(5),
  },
  {
    id: "d1a0b2c3-0000-4000-8000-000000000008",
    slug: "irontide--portfolio-v7",
    owner: "irontide",
    name: "portfolio-v7",
    htmlUrl: "https://github.com/irontide/portfolio-v7",
    homepageUrl: "https://irontide.dev",
    tagline: "Six previous portfolios. Zero shipped side projects to put in them.",
    topics: ["portfolio", "nextjs", "three-js"],
    stars: 19,
    primaryLang: "TypeScript",
    lastCommit: ago(11),
    slopScore: 69,
    breakdown: {
      originality: 74,
      abandonment: 14,
      readmeCope: 71,
      commitPoetry: 68,
      vibeCheck: 88,
    },
    skulls: 431,
    oneLiner: "The Projects section links to five other portfolios.",
    pageRoast:
      "This is portfolio-v7. Repositories v3 through v6 are still public. The Projects section of v7 contains five entries, and three of them are previous versions of this portfolio. You have built a portfolio whose primary content is portfolios.\n\nThe site loads a 4.2MB Three.js scene before any text renders. On a throttled connection the largest contentful paint is 6.8 seconds — most visitors leave before learning your name, which the scene is a spinning 3D model of.\n\nThe good news: the code is clean, the commits are recent, and the animations are genuinely nice. Build something to put in it.",
    crimes: [
      {
        category: "originality",
        evidence: "3 of 5 listed projects are previous portfolio versions",
      },
      {
        category: "vibe_check",
        evidence: "4.2MB Three.js bundle blocks first paint",
        detail: "LCP 6.8s on throttled 4G.",
      },
      {
        category: "readme_cope",
        evidence: 'README: "constantly shipping" — v6 shipped 2 years ago',
      },
      {
        category: "commit_poetry",
        evidence: "22 commits named 'design tweaks'",
      },
    ],
    receipts: [
      {
        name: "Astro",
        url: "https://astro.build",
        description: "Ships zero JS by default. Would fix the 6.8s LCP.",
      },
      {
        name: "One good README",
        url: "https://github.com",
        description: "Cheaper than v8. Start there.",
      },
    ],
    video: { status: "ready", url: null },
    screenshotUrl: null,
    submittedAt: ago(6),
  },
];

export function findDemoEntry(idOrSlug: string): SlopEntry | undefined {
  return DEMO_ENTRIES.find(
    (entry) => entry.id === idOrSlug || entry.slug === idOrSlug,
  );
}
