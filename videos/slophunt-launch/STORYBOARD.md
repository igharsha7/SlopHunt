---
project: slophunt-launch
format: 1920x1080
duration_target: 60
music: minimal electronic, confident, restrained — premium product bed
music_gain: 0.05
sfx_gain: 0.20
captions: karaoke — active word is ink on a yellow block, never white-on-accent
palette: black #000000 · paper #EEEEEC · yellow #EBD22F · orange #FB4A16 · purple #4D17F5 · pink #FA9DCD
fonts: Oswald 700/900 display · Space Grotesk 400/700 body + chrome
---

# Video direction

The product is a joke with a real engine underneath, so the video must look
expensive and behave dryly. Restraint is the brand: heavy Oswald type on paper,
4px black borders, 8px hard offset shadows, square corners, one tilt per frame —
never two. Motion is **cut, not glide**: hard cuts on the beat, elements landing
with a short `back.out` settle rather than floating in. Nothing loops, nothing
pulses decoratively.

Colour discipline — this is what keeps it off the AI-slop pile:
- **Paper `#EEEEEC` is the default ground.** Two frames go full-bleed colour
  (Frame 2 purple, Frame 7 yellow) as punctuation, not as a pattern.
- **Yellow `#EBD22F` is the single highlight** — the active caption word, the
  one keyword per line, the score bar. Nothing else may claim it.
- **Orange `#FB4A16` is reserved for the verdict** (the score number, the crime
  markers). It appears in Frames 4 and 5 only.
- Purple and pink carry section grounds and stickers. Never body text.

Type scale is the hierarchy — colour never is. A word is emphasised by size and
weight first; yellow is the last resort, once per frame.

Assets are the **real product**, captured from the live site: no mockups, no
invented dashboards. The score card, the leaderboard row and the evidence log
are the shipped components.

Karaoke captions sit in a fixed lower band (keep-out: bottom 180px). Inactive
words are ink at 55% on paper; the active word is **ink on a solid yellow
block** — dark-on-light, so it stays readable at phone size.

Audio: BGM at 5% under the voice, ducking never needed at that level. SFX only
on frame transitions — a short paper-cut click, nothing per-element. 20%.

---

# Frame 1 — Hook

id: 01-hook
duration: 7
transition_in: none
music: continue
sfx: none
asset_candidates: capture/assets/slophunt.png (wordmark)
status: outline

**Beat:** Say the uncomfortable thing first, before naming the product.

**Shot sequence**

- **0.0–1.2s** — Paper ground, faint graph grid. The line arrives one clause at
  a time in Oswald 900, ink, left-aligned, 3 lines: "EVERY LAUNCH PAGE / TELLS
  YOU YOUR PROJECT / IS BRILLIANT." Each line hard-cuts in on the narration,
  `y: 40 → 0`, 0.22s, `power4.out`. No fade-up drift.
- **1.2–4.5s** — Line holds. Nothing moves. The stillness is the point.
- **4.5–6.2s** — Second sentence replaces it in place, same position, on a hard
  cut: "NONE OF THEM HAVE READ YOUR COMMIT HISTORY." The words "COMMIT HISTORY"
  land on a yellow block — the frame's single highlight.
- **6.2–7.0s** — SlopHunt wordmark fades up small, bottom-left, 40% scale.

Motion: `text-cut-in`, `keyword-block`

---

# Frame 2 — Problem

id: 02-problem
duration: 9
transition_in: hard cut
music: continue
sfx: paper-click
asset_candidates: none (typographic)
status: outline

**Beat:** Name the enemy. Full-bleed purple — the only dark frame until the end.

**Shot sequence**

- **0.0–0.3s** — Hard cut to full-bleed purple `#4D17F5`. Paper type inverts to
  `#EEEEEC`.
- **0.3–3.0s** — "PRODUCT HUNT IS A HYPE MACHINE" in Oswald 900, paper, centred,
  arriving as one block with a 0.24s `back.out(1.6)` settle.
- **3.0–5.5s** — Three fake-praise pills tilt in stacked, staggered 0.12s, each
  a white card with 4px black border and 8px offset shadow: "Congrats on the
  launch!" · "🚀 Shipped!" · "Love this!" — deliberately hollow.
- **5.5–8.2s** — The pills grey out to 30% and one ink line cuts in beneath:
  "NOBODY MENTIONS THE DEMO DIED FOURTEEN MONTHS AGO." "FOURTEEN MONTHS" takes
  the yellow block.
- **8.2–9.0s** — Hold.

Motion: `cut-to-color`, `stagger-cards`, `keyword-block`

---

# Frame 3 — How it works

id: 03-how
duration: 11
transition_in: hard cut
music: continue
sfx: paper-click
asset_candidates: capture/screenshots/scroll-000.png (hero + submit box)
status: outline

**Beat:** The mechanism, shown as four agents working at once — parallelism is
the product claim, so the layout must be parallel.

**Shot sequence**

- **0.0–0.5s** — Cut back to paper. The real submit box (captured from the live
  hero) sits centred in a bordered card, tilted −2°.
- **0.5–2.4s** — A URL types into it, monospace, character-by-character:
  `github.com/nickthelegend/loom`. Cursor blinks twice. Enter — the card presses
  down 4px into its shadow (the site's real `.press` behaviour).
- **2.4–6.5s** — The card splits into **four columns simultaneously**, not in
  sequence: REPO CRAWLER · SITE CRAWLER · ORIGINALITY · ANALYSIS. Each is a
  bordered card that scales `0.9 → 1` in 0.3s, all four starting within 80ms —
  the near-simultaneity is the visual argument for "in parallel".
- **6.5–9.5s** — Under each, its finding ticks up in Space Grotesk: "100
  commits" · "0 screenshots" · "3 receipts" · "5 sub-scores". Counters, not
  fades.
- **9.5–11.0s** — The four columns converge into a single ink bar.

Motion: `type-in`, `press-down`, `parallel-split`, `count-up`

---

# Frame 4 — The score

id: 04-score
duration: 10
transition_in: hard cut
music: continue
sfx: paper-click
asset_candidates: capture/screenshots/scroll-051.png (score card)
status: outline

**Beat:** The payoff. The real score card, with the number as the hero.

**Shot sequence**

- **0.0–0.4s** — Cut to paper. The ink bar from Frame 3 becomes the top edge of
  the real score card, which drops in and settles (`back.out(1.8)`, 0.34s).
- **0.4–2.6s** — The number counts `0 → 16` in orange `#FB4A16`, Oswald 900 at
  frame scale, `power3.out` over 1.6s. Everything else is still while it runs.
- **2.6–6.0s** — Five sub-score bars wipe left-to-right, staggered 0.1s, each
  labelled in Space Grotesk: ORIGINALITY DEFICIT · ABANDONMENT INDEX · README
  COPE · COMMIT POETRY · VIBE CHECK. Bars fill yellow.
- **6.0–8.5s** — Right of the card, ink text cuts in: "COMPUTED FROM DATES AND
  COUNTS." then, beneath, smaller: "NOT VIBES." — "NOT VIBES" takes the yellow
  block.
- **8.5–10.0s** — Hold on the composed card.

Motion: `settle-in`, `count-up`, `bar-wipe`, `keyword-block`

---

# Frame 5 — The evidence

id: 05-evidence
duration: 10
transition_in: hard cut
music: continue
sfx: paper-click
asset_candidates: capture/screenshots/scroll-068.png (evidence log)
status: outline

**Beat:** The differentiator — it cites sources. Present it like a case file.

**Shot sequence**

- **0.0–0.5s** — Cut to paper. Header pill: "EVIDENCE LOG", ink on yellow,
  tilted +2°.
- **0.5–5.5s** — Three evidence rows cut in, 0.5s apart, each numbered in
  orange and monospaced: `01 Commit: "fix" ×9` · `02 Demo link returns nothing`
  · `03 Three projects already do this`. Each row underlines itself
  left-to-right as it lands.
- **5.5–8.0s** — Row 03 expands: three real receipt cards slide out beneath it,
  staggered 0.1s, each bordered with the offset shadow.
- **8.0–10.0s** — Ink line beneath: "EVERY JOKE CITES EVIDENCE." — "CITES
  EVIDENCE" on yellow.

Motion: `row-cut-in`, `underline-wipe`, `stagger-cards`, `keyword-block`

---

# Frame 6 — The video + leaderboard

id: 06-video
duration: 8
transition_in: hard cut
music: continue
sfx: paper-click
asset_candidates: capture/screenshots/scroll-034.png (leaderboard podium)
status: outline

**Beat:** Two outputs in one frame — the vertical roast, and public ranking.

**Shot sequence**

- **0.0–0.4s** — Cut to paper, split composition: left 40% a 9:16 phone-shaped
  card, right 60% the leaderboard.
- **0.4–3.0s** — Inside the 9:16 card, three roast caption cards cycle on hard
  cuts (0.7s each) in the video's own colour rotation — a video inside the
  video, unmistakably the product's real output.
- **3.0–6.0s** — Right side: the real podium builds — rank 1 yellow card rises
  centre, pink and white flanks tilt in either side, 0.12s apart.
- **6.0–8.0s** — Ink line across the base: "RANKED IN PUBLIC." — "PUBLIC" on
  yellow.

Motion: `split-reveal`, `cut-cycle`, `podium-build`, `keyword-block`

---

# Frame 7 — Call to action

id: 07-cta
duration: 5
transition_in: hard cut
music: resolve
sfx: paper-click
asset_candidates: capture/assets/slophunt.png (wordmark)
status: outline

**Beat:** Land it. Full-bleed yellow, wordmark, URL. Nothing else.

**Shot sequence**

- **0.0–0.4s** — Hard cut to full-bleed yellow `#EBD22F`.
- **0.4–1.6s** — The real SlopHunt wordmark scales `0.86 → 1` with a
  `back.out(1.8)` settle, centred.
- **1.6–3.2s** — Beneath it, the three-beat tagline cuts in word-group by
  word-group, ink Oswald 900: "SUBMIT YOUR REPO. / GET ROASTED. / GET RANKED."
- **3.2–4.4s** — URL pill lands: `slophunt.vercel.app` — ink card, paper text,
  8px offset shadow.
- **4.4–5.0s** — Everything holds. Music resolves. Cut to black.

Motion: `settle-in`, `text-cut-in`, `pill-land`
