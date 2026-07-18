# SlopHunt

**Product Hunt for slop. Submit your repo. Get roasted. Get ranked.**

An AI agent pipeline crawls your GitHub repo, finds the dead demo links and the
`"final final v2"` commits, computes a Slop Score (0–100), writes a brutally
specific roast in the voice of Deepak from Code Review, and puts it all on a
public leaderboard — with a Product-Hunt-style page your repo never asked for.

The full product spec lives in [docs/project-details.md](docs/project-details.md).

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind v4
- **Supabase** — Postgres, RLS, GitHub OAuth
- **GSAP + ScrollTrigger** — scroll reveals, score count-up, hero choreography
- **next/og** — dynamic per-repo share cards

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:3000
```

The UI runs fully on demo fixtures until the database is provisioned:

1. Apply `supabase/migrations/0001_init.sql` in the Supabase SQL Editor.
2. Enable the GitHub provider under Authentication → Providers.
3. Set `SUPABASE_SECRET_KEY` in `.env.local` (Project Settings → API Keys).

### Brand

Drop the wordmark at `public/text-logo.png` and the nav + footer pick it up
automatically (they fall back to a typographic mark while it's missing).

## House rules

- **Self-submission only.** You roast your own repos, or repos tagged `roast-me`.
- **Roast the software, never the person.**
- **Every joke cites evidence.** No crime in the crawl data, no joke.
- **Leaked secrets are flagged, never displayed.**
- Instant text path never waits on the video render.
