import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { getEntry } from "@/lib/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SlopHunt roast card";

// Palette inlined — the OG runtime has no access to our Tailwind tokens.
const PAPER = "#ffffff";
const INK = "#141414";
const ASH = "#555555";
const SUN = "#ebd22f";
const POP = "#fb4a16";

function scoreHex(score: number): string {
  if (score >= 90) return POP;
  if (score >= 75) return "#b45309";
  if (score >= 50) return "#9c7e06";
  return "#178743";
}

async function loadLogo(): Promise<string | null> {
  try {
    const file = await readFile(
      path.join(process.cwd(), "public", "text-logo.png"),
    );
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, logo] = await Promise.all([getEntry(id), loadLogo()]);

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
            background: PAPER,
            color: INK,
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
          background: PAPER,
          padding: "64px 72px 0",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo + owner */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {logo ? (
            <img src={logo} height={64} alt="" />
          ) : (
            <span
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: POP,
                textTransform: "uppercase",
              }}
            >
              SlopHunt
            </span>
          )}
          <span
            style={{
              fontSize: 26,
              color: ASH,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            @{entry.owner}
          </span>
        </div>

        {/* Middle: score + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 52 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 230,
                fontWeight: 900,
                lineHeight: 1,
                color: accent,
                letterSpacing: -6,
              }}
            >
              {entry.slopScore}
            </span>
            <span
              style={{
                fontSize: 26,
                color: ASH,
                textTransform: "uppercase",
                letterSpacing: 4,
              }}
            >
              Slop Score
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: INK,
                textTransform: "uppercase",
                lineHeight: 1,
                letterSpacing: -1,
              }}
            >
              {entry.name}
            </span>
            <span
              style={{
                marginTop: 26,
                fontSize: 31,
                color: INK,
                lineHeight: 1.3,
                borderLeft: `8px solid ${POP}`,
                paddingLeft: 22,
              }}
            >
              &ldquo;{entry.oneLiner}&rdquo;
            </span>
          </div>
        </div>

        {/* Bottom: yellow band, byooooob-style */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: SUN,
            borderTop: `4px solid ${INK}`,
            margin: "0 -72px",
            padding: "22px 72px",
            fontSize: 26,
            color: INK,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <span>Submit your repo. Get roasted. Get ranked.</span>
          <span style={{ color: POP, fontWeight: 900 }}>slophunt</span>
        </div>
      </div>
    ),
    size,
  );
}
