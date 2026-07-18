import { describe, expect, it } from "vitest";

import { buildComposition } from "../../video/generate-composition.mjs";

/**
 * The composition is what the renderer consumes. These lock the HyperFrames
 * authoring contract (timing attributes, seek-safe exits) and the constraints
 * the spec puts on the video: 9:16, under 45 seconds.
 */

const payload = {
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
    expect(duration).toBeGreaterThan(20);
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

  it("fades .inner wrappers, never clip elements — seek safety", () => {
    // A `.to("#id", {opacity})` on a bare clip id is the bug the linter flags.
    expect(html).not.toMatch(/\.to\("#(hook|crime-\d|score|outro)",\s*\{\s*opacity/);
    expect(html).toMatch(/\.to\("#hook \.inner",\s*\{\s*opacity: 0/);
  });

  it("pairs every exit fade with a hard-kill set at the clip boundary", () => {
    const fades = html.match(/\.to\("#[\w-]+ \.inner", \{ opacity: 0/g) ?? [];
    const kills = html.match(/\.set\("#[\w-]+ \.inner", \{ opacity: 0 \}/g) ?? [];
    expect(fades.length).toBeGreaterThan(0);
    expect(kills.length).toBe(fades.length);
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

  it("caps crime cards at four to keep the runtime under 45s", () => {
    const many = buildComposition({
      ...payload,
      crimes: Array.from({ length: 10 }, (_, i) => ({ evidence: `crime ${i}` })),
    });
    expect((many.match(/class="clip crime"/g) ?? []).length).toBe(4);
    expect(rootDuration(many)).toBeLessThan(45);
  });

  it("shortens the video when there are fewer crimes", () => {
    const two = buildComposition({ ...payload, crimes: payload.crimes.slice(0, 2) });
    expect(rootDuration(two)).toBeLessThan(rootDuration(buildComposition(payload)));
  });

  it("accepts plain-string crimes as well as objects", () => {
    const html = buildComposition({ ...payload, crimes: ["a plain string crime"] });
    expect(html).toContain("a plain string crime");
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
