import { ImageResponse } from "next/og";

import { getEntry } from "@/lib/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SlopHunt roast card";

// Palette inlined — the OG runtime has no access to our Tailwind tokens.
const VOID = "#0a0a0b";
const BONE = "#fafaf9";
const ASH = "#8a8a94";
const TOXIC = "#b6ff3c";

function scoreHex(score: number): string {
  if (score >= 90) return "#ff4d1c";
  if (score >= 75) return "#ffb020";
  if (score >= 50) return TOXIC;
  return "#3ddc84";
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntry(id);

  if (!entry) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: VOID,
            color: BONE,
            fontSize: 64,
            fontWeight: 900,
          }}
        >
          SlopHunt
        </div>
      ),
      size,
    );
  }

  const accent = scoreHex(entry.slopScore);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: VOID,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand + owner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, background: TOXIC }} />
            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: BONE,
                textTransform: "uppercase",
                letterSpacing: -1,
              }}
            >
              SlopHunt
            </span>
          </div>
          <span style={{ fontSize: 26, color: ASH, textTransform: "uppercase", letterSpacing: 2 }}>
            @{entry.owner}
          </span>
        </div>

        {/* Middle: score + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                fontSize: 240,
                fontWeight: 900,
                lineHeight: 1,
                color: accent,
                letterSpacing: -8,
              }}
            >
              {entry.slopScore}
            </span>
            <span style={{ fontSize: 26, color: ASH, textTransform: "uppercase", letterSpacing: 4 }}>
              Slop Score
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                fontSize: 76,
                fontWeight: 900,
                color: BONE,
                textTransform: "uppercase",
                lineHeight: 0.95,
                letterSpacing: -2,
              }}
            >
              {entry.name}
            </span>
            <span
              style={{
                marginTop: 28,
                fontSize: 32,
                color: accent,
                lineHeight: 1.3,
                borderLeft: `6px solid ${accent}`,
                paddingLeft: 20,
              }}
            >
              &ldquo;{entry.oneLiner}&rdquo;
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${ASH}`,
            paddingTop: 28,
            fontSize: 26,
            color: ASH,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <span>Submit your repo. Get roasted. Get ranked.</span>
          <span style={{ color: TOXIC }}>slophunt</span>
        </div>
      </div>
    ),
    size,
  );
}
