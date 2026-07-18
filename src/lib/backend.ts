/**
 * Backend client.
 *
 * The heavy work — GitHub crawl, scoring, Grok roast, Kokoro TTS, HyperFrames
 * render — runs on the tunnelled Node backend, not in Next. Rendering needs
 * Chrome and ffmpeg, which no serverless/edge runtime provides, so the
 * frontend deploys to Vercel and calls out to a machine that can.
 *
 * With NEXT_PUBLIC_BACKEND_URL unset the app still runs: submissions fall back
 * to the in-app /api/submit route, which does everything except video.
 */

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";

export const hasBackend = () => BACKEND_URL.length > 0;

export interface SubmitResponse {
  slug: string;
  slopScore: number;
  roast: { oneLiner: string; tagline: string; pageRoast: string; model: string };
  persisted: boolean;
  video?: { status: string; poll: string };
}

/** Routes to the backend when configured, otherwise the local API route. */
export async function submitRepo(
  repo: string,
  login?: string | null,
): Promise<{ ok: true; data: SubmitResponse } | { ok: false; error: string }> {
  const url = hasBackend() ? `${BACKEND_URL}/api/submit` : "/api/submit";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repo, login }),
    });
    const data = (await res.json()) as SubmitResponse & { error?: string };

    if (!res.ok || !data.slug) {
      return { ok: false, error: data.error ?? "The pipeline choked. Try again." };
    }
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: hasBackend()
        ? "Can't reach the roast backend. Is the tunnel up?"
        : "Network hiccup. The roast is willing; the connection was weak.",
    };
  }
}

export interface VideoJob {
  status: "rendering" | "ready" | "failed" | "unknown";
  videoUrl?: string;
  error?: string;
}

export async function pollVideo(slug: string): Promise<VideoJob> {
  if (!hasBackend()) return { status: "unknown" };
  try {
    const res = await fetch(`${BACKEND_URL}/api/video/${encodeURIComponent(slug)}`);
    if (!res.ok) return { status: "unknown" };
    return (await res.json()) as VideoJob;
  } catch {
    return { status: "unknown" };
  }
}
