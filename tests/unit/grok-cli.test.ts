import { describe, expect, it } from "vitest";

import { parseGrokCliOutput } from "@/lib/pipeline/grok-cli";

/**
 * The Grok CLI wraps the schema-constrained object in its own envelope. This
 * is exactly where the first integration attempt broke: the parser looked at
 * `result`/`response`/`output` but the payload lives on `structuredOutput`.
 */

const ROAST = {
  video_script: "Three stars. Four days old.",
  page_roast: "Para one.\n\nPara two.",
  one_liner: "Already a cover band.",
  tagline: "Product Hunt for leftovers.",
  caption_lines: ["Three stars. Four days old.", "Already a cover band."],
};

function envelope(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    text: JSON.stringify(ROAST),
    stopReason: "EndTurn",
    sessionId: "abc",
    usage: { total_tokens: 100 },
    structuredOutput: ROAST,
    ...over,
  });
}

describe("parseGrokCliOutput", () => {
  it("reads the payload off structuredOutput", () => {
    const r = parseGrokCliOutput(envelope());
    expect(r?.oneLiner).toBe("Already a cover band.");
    expect(r?.model).toBe("grok-cli");
    expect(r?.captionLines).toHaveLength(2);
  });

  it("falls back to the JSON string on text when structuredOutput is absent", () => {
    const r = parseGrokCliOutput(
      JSON.stringify({ text: JSON.stringify(ROAST), stopReason: "EndTurn" }),
    );
    expect(r?.videoScript).toBe("Three stars. Four days old.");
  });

  it("returns null when the envelope carries no roast", () => {
    expect(
      parseGrokCliOutput(JSON.stringify({ text: "I'd rather not.", stopReason: "EndTurn" })),
    ).toBeNull();
  });

  it("returns null on non-JSON stdout", () => {
    expect(parseGrokCliOutput("command not found")).toBeNull();
  });

  it("rejects a partial roast rather than shipping blanks", () => {
    const partial = { ...ROAST, one_liner: "" };
    expect(parseGrokCliOutput(envelope({ structuredOutput: partial, text: "" }))).toBeNull();
  });

  it("tolerates a missing caption_lines array", () => {
    const noCaptions = { ...ROAST, caption_lines: undefined };
    const r = parseGrokCliOutput(envelope({ structuredOutput: noCaptions, text: "" }));
    expect(r?.captionLines).toEqual([]);
  });

  it("drops blank caption beats", () => {
    const messy = { ...ROAST, caption_lines: ["good", "", "   ", "also good"] };
    const r = parseGrokCliOutput(envelope({ structuredOutput: messy, text: "" }));
    expect(r?.captionLines).toEqual(["good", "also good"]);
  });

  it("enforces the length caps", () => {
    const long = {
      ...ROAST,
      one_liner: "x".repeat(300),
      tagline: "y".repeat(300),
    };
    const r = parseGrokCliOutput(envelope({ structuredOutput: long, text: "" }));
    expect(r?.oneLiner).toHaveLength(100);
    expect(r?.tagline).toHaveLength(80);
  });
});
