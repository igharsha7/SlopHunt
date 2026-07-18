import { describe, expect, it } from "vitest";

import { buildComposition } from "../../video/generate-composition.mjs";

/**
 * The composition is what the renderer consumes. These lock the HyperFrames
 * authoring contract (timing attributes, seek-safe exits) and the constraints
 * the spec puts on the video: 9:16, under 45 seconds.
 */

/** Caption-driven payload — what the Grok CLI tier produces. */
const payload = {
  owner: "igharsha7",
  name: "SlopHunt",
  slopScore: 32,
  oneLiner: "A Product Hunt clone that scores others on originality.",
  captionLines: [
    "Three stars. Four days old.",
    "Already a cover band.",
    "Roast-my-repo has two thousand stars.",
    "Nine of forty commits just say fix.",
    "Slop Score: thirty-two.",
  ],
  crimes: [],
};

/** Legacy payload — no script, so the composer falls back to crime cards. */
const crimePayload = {
  owner: "igharsha7",
  name: "SlopHunt",
  slopScore: 32,
  oneLiner: "A Product Hunt clone that scores others on originality.",
  crimes: [
    { evidence: "3 existing projects already do this" },
    { evidence: "README claims it is the last tool you'll need" },
    { evidence: "11 TODO markers in a four-day-old repo" },
    { evidence: "Demo link returns nothing" },
  ],
};

function rootDuration(html) {
  return Number(html.match(/data-composition-id="main"[\s\S]*?data-duration="([\d.]+)"/)[1]);
}

describe("composition contract", () => {
  const html = buildComposition(payload);

  it("declares a 9:16 root at 1080x1920", () => {
    expect(html).toContain('data-width="1080"');
    expect(html).toContain('data-height="1920"');
  });

  it("stays under the 45-second spec limit", () => {
    const duration = rootDuration(html);
    expect(duration).toBeGreaterThan(5);
    expect(duration).toBeLessThan(45);
  });

  it("registers a paused timeline under the composition id", () => {
    expect(html).toContain('window.__timelines["main"]');
    expect(html).toContain("gsap.timeline({ paused: true })");
  });

  it("gives every clip a start, duration and track index", () => {
    const clips = html.match(/class="clip[^"]*"[^>]*/g) ?? [];
    expect(clips.length).toBeGreaterThanOrEqual(6);
    for (const clip of clips) {
      expect(clip).toMatch(/data-start="[\d.]+"/);
      expect(clip).toMatch(/data-duration="[\d.]+"/);
      expect(clip).toMatch(/data-track-index="\d+"/);
    }
  });

  it("never fades a clip element — the framework owns clip visibility", () => {
    // A `.to("#id", {opacity})` on a bare clip id leaves stale state when the
    // renderer seeks non-linearly. The linter flags it; this keeps it gone.
    expect(html).not.toMatch(
      /\.to\("#(hook|beat-\d+|crime-\d+|score|outro)",\s*\{[^}]*opacity/,
    );
  });

  it("uses hard cuts — entrances only, no exit tweens to reverse", () => {
    // Cuts read as energy AND sidestep stale-visibility entirely: with no exit
    // fade there is nothing for a seek to land mid-way through.
    const exitFades = html.match(/\.to\("#[\w.\- ]+", \{ opacity: 0/g) ?? [];
    expect(exitFades).toHaveLength(0);

    // Every scene still animates in.
    expect(html).toMatch(/fromTo\("#beat-0 \.beat-text"/);
    expect(html).toMatch(/fromTo\("#hook \.repo"/);
  });

  it("cuts fast enough to hold attention — no beat lingers past 3s", () => {
    const durations = [...html.matchAll(/class="clip beat"[^>]*data-duration="([\d.]+)"/g)].map(
      (m) => Number(m[1]),
    );
    expect(durations.length).toBeGreaterThan(0);
    for (const d of durations) expect(d).toBeLessThanOrEqual(3);
  });

  it("does not link external Google Fonts", () => {
    expect(html).not.toContain("fonts.googleapis.com");
  });
});

describe("composition content", () => {
  it("renders the repo, owner and score", () => {
    const html = buildComposition(payload);
    expect(html).toContain("SlopHunt");
    expect(html).toContain("@igharsha7");
    expect(html).toContain("v: 32");
  });

  it("escapes HTML in untrusted repo data", () => {
    const html = buildComposition({
      ...payload,
      name: '<img src=x onerror="alert(1)">',
      oneLiner: 'Quote " and <script>',
    });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;img");
  });

  it("falls back to crime cards when there is no script", () => {
    const html = buildComposition(crimePayload);
    expect(html).toContain("3 existing projects already do this");
    expect(rootDuration(html)).toBeLessThan(45);
  });

  it("caps the crime-card fallback at four to hold the runtime", () => {
    const many = buildComposition({
      ...crimePayload,
      crimes: Array.from({ length: 10 }, (_, i) => ({ evidence: `crime ${i}` })),
    });
    expect((many.match(/class="clip beat"/g) ?? []).length).toBe(4);
    expect(rootDuration(many)).toBeLessThan(45);
  });

  it("shortens the video when there are fewer beats", () => {
    const two = buildComposition({ ...payload, captionLines: payload.captionLines.slice(0, 2) });
    expect(rootDuration(two)).toBeLessThan(rootDuration(buildComposition(payload)));
  });

  it("scales beats to fill the voiceover so captions track the audio", () => {
    const withVoice = buildComposition({
      ...payload,
      audio: { file: "vo.wav", duration: 20 },
    });
    const beats = [...withVoice.matchAll(/class="clip beat"[^>]*data-duration="([\d.]+)"/g)].map(
      (m) => Number(m[1]),
    );
    const spoken = beats.reduce((a, b) => a + b, 0);
    // Beats cover the voice minus the cold open, within a frame or two.
    expect(spoken).toBeGreaterThan(16);
    expect(spoken).toBeLessThan(19);
    expect(withVoice).toContain('id="voiceover"');
  });

  it("accepts plain-string crimes as well as objects", () => {
    // crimePayload has no captionLines, so the crime-card branch is taken.
    const html = buildComposition({ ...crimePayload, crimes: ["a plain string crime"] });
    expect(html).toContain("a plain string crime");
  });

  it("prefers the script over crime cards when both are present", () => {
    const html = buildComposition({
      ...payload,
      crimes: [{ evidence: "SHOULD NOT APPEAR" }],
    });
    expect(html).toContain("Already a cover band.");
    expect(html).not.toContain("SHOULD NOT APPEAR");
  });

  it("is deterministic — identical payload, identical bytes", () => {
    expect(buildComposition(payload)).toBe(buildComposition(payload));
  });

  it("emits timings free of floating-point dust", () => {
    const html = buildComposition(payload);
    expect(html).not.toMatch(/\d\.\d{6,}/);
  });

  it("picks a readable score colour for the purple card", () => {
    // The site's light-bg green (#178743) is ~1.7:1 on grape — must not appear.
    expect(buildComposition({ ...payload, slopScore: 20 })).not.toContain("#178743");
    expect(buildComposition({ ...payload, slopScore: 96 })).toContain("#ff7a45");
  });

  it("maps the score to the right verdict band", () => {
    // Bands must match src/lib/slop.ts scoreVerdict exactly.
    expect(buildComposition({ ...payload, slopScore: 96 })).toContain("BEYOND SAVING");
    expect(buildComposition({ ...payload, slopScore: 92 })).toContain("CRIME SCENE");
    expect(buildComposition({ ...payload, slopScore: 71 })).toContain("STRUGGLING");
    expect(buildComposition({ ...payload, slopScore: 32 })).toContain("ANNOYINGLY GOOD");
  });
});
