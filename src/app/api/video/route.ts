import { NextResponse, type NextRequest } from "next/server";

import { getEntry } from "@/lib/queries";
import { renderRoastVideo, toVideoPayload } from "@/lib/pipeline/video";

// Rendering is minutes, not seconds — this route is meant to be kicked off out
// of band (webhook, queue worker, or a manual retry), never awaited by a page.
export const maxDuration = 800;

/**
 * POST /api/video { slug }
 * Renders the HyperFrames roast for an already-roasted repo and attaches the
 * MP4 to its page. The instant path never waits on this.
 */
export async function POST(request: NextRequest) {
  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send JSON: { slug }" }, { status: 400 });
  }

  if (!body.slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const entry = await getEntry(body.slug);
  if (!entry) {
    return NextResponse.json({ error: "No such roast." }, { status: 404 });
  }

  const url = await renderRoastVideo(entry.id, toVideoPayload(entry));
  if (!url) {
    return NextResponse.json(
      { error: "Render failed — the video slot keeps its placeholder." },
      { status: 502 },
    );
  }

  return NextResponse.json({ slug: entry.slug, videoUrl: url });
}
