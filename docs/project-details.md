# SlopHunt — Build Document
### "Product Hunt for slop. Submit your repo. Get roasted. Get ranked."
**Target: Codex Hackathon · Build window: 1 day · Builder: Nivesh**

---

## 1. The Concept

SlopHunt is Product Hunt's evil twin. Instead of launching your product to applause, you submit your GitHub repo to get **roasted by an AI agent — on video** — scored, ranked on a public leaderboard, and given a full Product-Hunt-style product page (tags, description, screenshots, links) that it never asked for and doesn't deserve.

The core loop:

```
Paste GitHub repo URL
      ↓
Agents crawl repo + live site
      ↓
Instant: text roast + Slop Score + product page + leaderboard placement
      ↓
Async: HyperFrames video roast (talking host character, 9:16, <45s)
      ↓
One-tap share → new users → loop
```

The joke is self-aware: the roast agent's favorite line is "this already exists" — and it proves it with links. A directory of unoriginal software, built by an idea that is itself gloriously derivative. That meta-humor IS the brand.

---

## 2. Pain Points We're Addressing (the real ones under the joke)

1. **No honest feedback loop for side projects.** Product Hunt is a hype machine — everything gets "Congrats on the launch! 🚀". Nobody tells you your repo is abandoned, your README lies, and 8 identical products exist. SlopHunt is the brutal code review your friends won't give you.
2. **Existing repo-roasters are boring.** Text-only, generic LLM snark, zero specificity, zero shareability. No video, no scoring, no leaderboard, no persistence. They're a one-shot gag with no product around it.
3. **"Does this already exist?" is a real question with no good tool.** Devs genuinely want to know if their idea is taken. Our "Already Exists Receipts" feature answers it — wrapped in comedy, but actually useful.
4. **Devs want distribution for dead projects.** Counterintuitively: getting publicly roasted is *attention*. A savage video about your repo will get more eyeballs than your Show HN ever did. Humiliation-as-marketing.
5. **Share-first content for dev culture is underserved.** Dev Twitter/Reels runs on self-deprecating humor. Nobody has productized it with a recurring character and a leaderboard.

---

## 3. Feature Set (full)

### 3.1 Core (must ship today)
- **Repo submission** — paste a GitHub URL. Self-submission only (see Safety, §7).
- **Repo crawler agent** — clones/fetches via GitHub API: README, languages, commit history, commit messages, stars/forks, open issues, last activity, file tree, package manifests, TODOs/FIXMEs, branch list.
- **Site crawler agent** — if a homepage/demo URL exists (from repo metadata or README), headless-browser it, take full-page + hero screenshots, extract title/description/OG tags. (Nivesh: this is literally RenderGate — reuse it.)
- **Roast engine** — generates a *specific* roast citing real crimes from the crawl data. Never generic. Output: roast script (for video), roast text (for page), one-liner (for OG image).
- **Slop Score™ (0–100)** with breakdown:
  - **Originality Deficit** — how many existing products do the same thing
  - **Abandonment Index** — commit recency/frequency decay
  - **README Cope Level** — promise-vs-reality gap (badges, "coming soon", dead demo links)
  - **Commit Poetry** — quality of commit messages ("fix", "asdf", "final final v2")
  - **Vibe Check** — dead code, TODO density, node_modules committed, .env leaked
- **Already Exists Receipts** — agent web-searches + finds 2–3 real existing products/repos doing the same thing, links them on the page. The most brutal AND most useful feature.
- **Product page per repo** — Product Hunt style: name, tagline (agent-rewritten, sarcastically), tags, description, screenshots, Slop Score card, roast text, receipts, video embed, upvote-equivalent ("💀 count").
- **Leaderboard** — ranked by Slop Score. Filters: Today / This Week / All Time / by tag.
- **HyperFrames video roast** — 9:16, <45s, recurring host character reads the roast script. Rendered **async**: page + score appear instantly, video slot shows "Your roast is rendering… the disappointment takes time." Notify/update when ready.

### 3.2 Virality layer (ship if time allows, in priority order)
1. **OG share images** — auto-generated card: repo name, Slop Score, worst one-liner from the roast. This is what renders when the link hits X/Discord. Non-negotiable for the share loop.
2. **One-tap share** — "Post my roast" → pre-filled X post with video/OG card + @SlopHunt tag.
3. **Category Awards** — Most Abandoned, Most Confident README, Peak 2021, AI Wrapper of the Day, Solved A Problem Nobody Had. Badges rendered on product pages.
4. **Roast Battles** — two repos enter, agent roasts both head-to-head, declares the sloppier one. Bracket mode for the hackathon demo.
5. **Weekly Worst-Of** — auto-compiled leaderboard recap video (same host character) — the retention/channel play.

### 3.3 The Host Character
One recurring avatar for ALL videos. Suggested persona: **"Deepak from Code Review"** — a burnt-out senior engineer who has reviewed 40,000 PRs and believed in software once, long ago. Dry, tired, devastating. Consistent character = brand = followable. All roast scripts are written in his voice.

---

## 4. Agent Pipeline (detailed)

```
                        ┌──────────────────────┐
  repo URL ────────────►│  1. INTAKE AGENT     │ validates URL, checks self-ownership
                        └─────────┬────────────┘  (GitHub OAuth OR "roast-me" file/issue proof)
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
        ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐
        │ 2a. REPO      │ │ 2b. SITE     │ │ 2c. ORIGINALITY  │
        │  CRAWLER      │ │  CRAWLER     │ │  AGENT           │
        │ GitHub API:   │ │ headless     │ │ extract pitch →  │
        │ readme,       │ │ browser →    │ │ web search +     │
        │ commits, tree,│ │ screenshots, │ │ GitHub search →  │
        │ langs, issues,│ │ meta/OG tags │ │ 2-3 receipts     │
        │ stars, TODOs  │ │              │ │                  │
        └───────┬───────┘ └──────┬───────┘ └────────┬─────────┘
                └────────────────┼──────────────────┘
                                 ▼
                        ┌──────────────────────┐
                        │ 3. ANALYSIS AGENT    │ computes Slop Score breakdown
                        │ (deterministic +     │ + extracts "crimes list":
                        │  LLM hybrid)         │ specific, citable evidence
                        └─────────┬────────────┘
                                  ▼
                        ┌──────────────────────┐
                        │ 4. ROAST WRITER      │ Deepak-voice script.
                        │ inputs: crimes list, │ 3 outputs:
                        │ score, receipts      │ • video script (~120 words)
                        │ RULE: every joke     │ • page roast (longer)
                        │ must cite evidence   │ • one-liner (OG image)
                        └─────────┬────────────┘
                          ┌───────┴────────┐
                          ▼                ▼
              ┌────────────────┐  ┌─────────────────────┐
              │ 5a. PAGE       │  │ 5b. VIDEO AGENT     │
              │ BUILDER        │  │ HyperFrames (HeyGen │
              │ product page + │  │ MCP): script →      │
              │ OG image +     │  │ 9:16 avatar video   │
              │ leaderboard    │  │ ASYNC, webhook/poll │
              │ upsert         │  │ → attach to page    │
              │ (INSTANT)      │  │ when ready          │
              └────────────────┘  └─────────────────────┘
```

**Key pipeline rules:**
- Steps 2a/2b/2c run **in parallel**. Total time to instant page: target <30s.
- Video is **never blocking**. Text roast + score is the instant dopamine; video is the delayed second hit (and a reason to come back / get a notification).
- Roast Writer has a hard constraint: **no joke without evidence**. Every line must reference a real artifact (commit message, date, file, receipt link). Generic roasts are rejected and regenerated.
- Slop Score is **mostly deterministic** (dates, counts, ratios) with LLM judgment only for README Cope and Vibe Check — so scores are consistent and defensible when people inevitably argue about them (arguing about scores is also engagement, so, win-win).

---

## 5. Tech Stack (optimized for 1-day build with what Nivesh already has)

- **Frontend:** Next.js (App Router) + Tailwind. Dark, brutalist-meme aesthetic. PH-style card grid.
- **Backend:** Next.js API routes / server actions + a lightweight job queue (Upstash QStash or just DB-status polling — don't overbuild).
- **DB:** Postgres (Supabase/Neon) — repos, scores, roasts, receipts, video status, 💀 counts.
- **Repo crawl:** GitHub REST API (no cloning needed — contents + commits + languages endpoints cover everything). Unauthed rate limits will hurt; use a token.
- **Site crawl/screenshots:** RenderGate (already built — headless browser API). Direct reuse.
- **LLM:** Claude via Anthropic API — analysis agent, roast writer, tagline rewriter.
- **Originality search:** web search tool + GitHub search API.
- **Video:** HyperFrames by HeyGen via MCP — script in, avatar video out, poll/webhook for completion.
- **OG images:** @vercel/og (satori) — dynamic score cards.
- **Auth (submission proof):** GitHub OAuth (simplest legit path) — you can only submit repos you own/collaborate on. Fallback hack: require a `roast-me` topic tag on the repo.

---

## 6. Phases of Development (today)

**Phase 0 — Skeleton (1 hr):** Next.js app, DB schema (repos, roasts, scores, videos, receipts), submit form, empty leaderboard, deploy pipeline working from minute one.

**Phase 1 — Crawl + Score (2 hrs):** GitHub API crawler → crimes extractor → deterministic Slop Score. Verify with 5 real repos (submit your own graveyard — you have plenty of hackathon repos, this is the dogfood joke).

**Phase 2 — Roast Engine (1.5 hrs):** Roast writer prompt with the evidence-only rule + Deepak voice. Iterate on 5 test repos until at least one line per roast makes you actually laugh. This is the product — spend the time here.

**Phase 3 — Product Pages + Leaderboard (1.5 hrs):** PH-style page: score card w/ breakdown, roast, tags, screenshots, receipts, 💀 button. Leaderboard with filters.

**Phase 4 — Video (2 hrs):** HyperFrames integration, async job flow, "rendering…" state, video embed on page when done. Test end-to-end latency early — if renders take >5 min, adjust script length.

**Phase 5 — Virality Polish (remaining time, in order):** OG images → one-tap share → Already Exists receipts on page → Category Awards → Roast Battle mode for the live demo.

**Demo script for judges:** live-submit a judge's (consenting) or your own repo → instant score + page on screen → cut to a pre-rendered video roast of a famous-format repo → show leaderboard → drop the battle mode. 90 seconds, all killer.

---

## 7. Safety Rails (do these, they take 20 minutes and save the product)

- **Self-submission only.** OAuth-verified ownership or `roast-me` repo topic. Without this it's a harassment tool and dies on arrival.
- **Roast the code, not the coder.** System-prompt-level rule: no attacks on identity, appearance, nationality, intelligence of the person. The repo is the target. Deepak is disappointed in the *software*.
- **Takedown = delete button** for the submitter. Instant, no questions.
- **No private repos, no secrets.** If the crawler finds a leaked .env/key, don't display it — just score it ("Vibe Check: we found something you should rotate. Today.") and optionally flag privately to the owner. That's a feature, not a leak.

---

## 8. THE MEGA PROMPT (paste this into Fable)

```
You are building SlopHunt — "Product Hunt for slop" — a complete web platform in ONE DAY for the Codex Hackathon. Read this entire spec before writing any code. Build it phase by phase in the order given. Do not gold-plate early phases; a working ugly loop beats a beautiful broken one.

=== WHAT SLOPHUNT IS ===
Developers submit their OWN GitHub repos. An AI agent pipeline crawls the repo and its website, generates a brutally specific comedy roast, computes a "Slop Score" (0-100), creates a Product-Hunt-style product page for the repo, ranks it on a public leaderboard, and asynchronously generates a video of a recurring AI host character delivering the roast (via HyperFrames/HeyGen). The tone is self-aware dev humor: brutal about the software, never about the person.

=== PAIN POINTS THIS SOLVES ===
1. No honest feedback exists for side projects (Product Hunt is a hype echo chamber).
2. Existing "roast my repo" tools are text-only, generic, unshareable, with no product around them.
3. "Does my idea already exist?" has no good tool — we answer it with linked receipts.
4. Dead side projects get zero distribution — a viral roast video is attention.
5. Dev culture runs on self-deprecating shareable content — nobody has productized it with a character + leaderboard.

=== TECH STACK ===
- Next.js (App Router) + TypeScript + Tailwind, dark brutalist-meme aesthetic, Product Hunt-style layouts
- Postgres (assume Supabase; use Prisma or drizzle). Tables: users, repos, crawls, scores, roasts, receipts, videos, reactions
- GitHub REST API for repo data (assume GITHUB_TOKEN env var). Do NOT git-clone; API endpoints only: repo meta, readme, languages, commits (last 100), contents tree, issues count, topics
- Headless browser screenshot service for websites: assume env var RENDERGATE_URL, an HTTP API: POST {url} -> {screenshot_png_base64, title, meta_description, og_tags}. Wrap it in a client module so it's swappable
- Anthropic API (claude-sonnet-4-6) for: analysis agent, roast writer, sarcastic tagline rewriter. Assume ANTHROPIC_API_KEY
- Web search + GitHub search API for the Originality Agent (finding existing similar products)
- HyperFrames by HeyGen via MCP for video generation. Assume an async pattern: submit script -> job id -> poll for completion -> video URL. Wrap in a client module with a MOCK MODE (env flag) that returns a placeholder video after 10s, so the whole app is testable without burning render credits
- @vercel/og for dynamic OG share images
- GitHub OAuth for auth (NextAuth). Submission rule: user can only submit repos they own or collaborate on. ALSO support fallback: repo has topic "roast-me" = consent, no auth needed

=== THE AGENT PIPELINE (implement as an orchestrated async job per submission) ===
1. INTAKE: validate GitHub URL, verify ownership (OAuth) or "roast-me" topic. Reject private repos.
2. PARALLEL CRAWL (Promise.all):
   2a. REPO CRAWLER: fetch readme, languages, last 100 commits (messages+dates), stars, forks, open issues, topics, file tree top 2 levels, package.json/requirements.txt if present. Extract: TODO/FIXME count from readme, dead-looking branches, whether node_modules or .env is committed, badge count in readme, "coming soon" phrases, demo links (test them for 404).
   2b. SITE CRAWLER: if homepage URL exists in repo meta or readme, screenshot it via RenderGate client, extract title/description/og.
   2c. ORIGINALITY AGENT: LLM extracts a one-sentence pitch of what the repo does, then web-search + GitHub-search for 2-3 REAL existing products/repos doing the same thing. Store name, url, one-line description for each. These are the "Already Exists Receipts."
3. ANALYSIS AGENT: compute Slop Score 0-100 from 5 sub-scores (each 0-100, weighted equally):
   - Originality Deficit: scaled by number/prominence of receipts found
   - Abandonment Index: deterministic from commit recency + frequency decay (last commit >12mo = near max)
   - README Cope Level: LLM judges promise-vs-reality gap (badges, superlatives, dead demo links, "coming soon")
   - Commit Poetry: deterministic-ish scoring of commit message quality ("fix", "asdf", "wip", "final final", single-word ratio)
   - Vibe Check: committed node_modules/.env, TODO density, dead branches (LLM assisted)
   Also output a CRIMES LIST: 6-10 specific, citable pieces of evidence (exact commit messages with dates, exact readme quotes, 404ing demo link, receipt links). Higher score = sloppier. IMPORTANT: if a leaked secret (.env, API key) is detected, do NOT store or display its value anywhere — only note "possible leaked secret detected" as a vibe check crime.
4. ROAST WRITER: persona is "Deepak from Code Review" — a burnt-out senior engineer who has reviewed 40,000 PRs, dry, tired, devastating, but roasts THE SOFTWARE never the person (hard rule: no jokes about identity, nationality, appearance, or intelligence of the author; the repo is the only target). Inputs: crimes list, score breakdown, receipts. HARD CONSTRAINT: every single joke must reference a specific item from the crimes list — reject and regenerate any generic filler like "your code is bad." Outputs (single structured JSON):
   - video_script: ~110-130 words, spoken-word pacing, opens with a cold hook, ends with the Slop Score reveal
   - page_roast: 150-250 word written version with the receipts woven in
   - one_liner: the single most brutal line, <100 chars, for the OG image
   - sarcastic_tagline: Product-Hunt-style tagline rewritten with contempt, <80 chars
5a. PAGE BUILDER (INSTANT PATH): upsert product page + leaderboard entry the moment steps 1-4 complete. Target under 30 seconds total. Page shows a "Your video roast is rendering... the disappointment takes time" placeholder in the video slot.
5b. VIDEO AGENT (ASYNC PATH): send video_script to HyperFrames client, store job id, poll (or webhook) until complete, attach video URL to page, flip status. NEVER block the instant path on video.

=== PAGES / UI ===
1. LANDING (/): hero with tagline "Product Hunt for slop. Submit your repo. Get roasted. Get ranked.", submit box front and center, live leaderboard below (Today / Week / All Time tabs, filter by tag), recent roasts feed with score badges. Dark, bold, meme-brutalist but CLEAN — Product Hunt information density, funeral-home color palette, one accent color (toxic green or blood orange).
2. PRODUCT PAGE (/r/[owner]/[repo]): PH-style. Header: repo name, sarcastic_tagline, tags(topics), links (repo, site). Left: screenshots carousel (site screenshots; fallback: styled readme render). Right: SLOP SCORE CARD — big number + 5-bar breakdown, each sub-score labeled. Below: video embed (or rendering placeholder), page_roast text, ALREADY EXISTS RECEIPTS section (2-3 linked cards: "You could have just used ___"), crimes list styled as a police report, 💀 reaction button (the upvote equivalent, one per visitor, localStorage+IP throttle is fine for hackathon), share button (pre-filled X post), delete button visible ONLY to the verified submitter (instant takedown, hard delete).
3. LEADERBOARD (/leaderboard): full table, rank by Slop Score, category award badges (Most Abandoned, Most Confident README, Peak 2021, AI Wrapper of the Day, Solved A Problem Nobody Had — awarded to current leaders of each sub-metric, computed on read).
4. BATTLE (/battle) [BUILD LAST]: pick/enter two already-roasted repos, LLM writes a head-to-head comparative roast, declares the sloppier one, shareable result card.
5. OG IMAGES: dynamic per product page via @vercel/og — repo name, Slop Score huge, one_liner, SlopHunt branding. This is critical: it is the share loop.

=== BUILD ORDER (do not deviate) ===
Phase 0 (skeleton): app scaffold, schema, submit form writes a row, static leaderboard, deployable.
Phase 1 (crawl+score): repo crawler + deterministic scores end-to-end on 5 real test repos.
Phase 2 (roast engine): analysis agent + roast writer, iterate the prompt until output is genuinely funny AND every joke cites evidence. This is the core product — prioritize quality here.
Phase 3 (pages): product page + leaderboard fully rendered from DB.
Phase 4 (video): HyperFrames client (with mock mode), async job flow, placeholder -> video swap.
Phase 5 (virality, in order): OG images -> share button -> receipts UI -> category awards -> battle mode.

=== NON-NEGOTIABLE RULES ===
- Self-submission only (OAuth ownership OR roast-me topic). No roasting strangers.
- Roast the software, never the human. Enforce in the roast writer system prompt.
- Instant text path never waits on video.
- Every roast joke cites specific evidence. Generic = regenerate.
- Never display leaked secrets.
- Mock mode env flags for HyperFrames AND RenderGate so the full loop runs locally with zero external deps.
- Ship each phase working before starting the next. Commit per phase with messages that would score well on Commit Poetry, because we are not hypocrites.

Environment variables to assume: DATABASE_URL, GITHUB_TOKEN, GITHUB_OAUTH_ID, GITHUB_OAUTH_SECRET, ANTHROPIC_API_KEY, RENDERGATE_URL, HYPERFRAMES_API_KEY, MOCK_VIDEO, MOCK_SCREENSHOTS, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL.

Begin with Phase 0. After each phase, output a short status: what works, what's stubbed, what's next.
```

---

*Doc v1 — built for a one-day sprint. The roast quality (Phase 2) is the product; everything else is delivery mechanism. Spend your iteration budget there.*