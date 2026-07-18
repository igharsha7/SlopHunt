"use client";

import { useEffect, useState } from "react";

import { VideoSlot } from "@/components/slop/video-slot";
import { hasBackend, pollVideo } from "@/lib/backend";
import type { VideoState } from "@/lib/slop";

/**
 * Live video slot.
 *
 * The render happens out of band on the tunnelled backend and takes minutes,
 * so the page ships instantly with a placeholder and this polls until the MP4
 * lands (spec §4: the instant path never waits on video).
 *
 * Polling stops on a terminal state, when the tab is hidden, and after a hard
 * ceiling — an abandoned tab must not hammer the backend forever.
 */

const INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 180; // ~15 minutes, past the longest observed render

export function VideoWatcher({
  slug,
  repoName,
  initialStatus,
  initialUrl,
}: {
  slug: string;
  repoName: string;
  initialStatus: VideoState;
  initialUrl: string | null;
}) {
  const [status, setStatus] = useState<VideoState>(initialStatus);
  const [url, setUrl] = useState<string | null>(initialUrl);

  useEffect(() => {
    // Nothing to wait for: already done, or no backend to ask.
    if (!hasBackend()) return;
    if (status === "ready" && url) return;
    if (status === "failed") return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled || attempts >= MAX_ATTEMPTS) return;
      attempts++;

      // Don't poll a backgrounded tab; resume when it's visible again.
      if (document.visibilityState === "hidden") {
        timer = setTimeout(tick, INTERVAL_MS);
        return;
      }

      const job = await pollVideo(slug);
      if (cancelled) return;

      if (job.status === "ready" && job.videoUrl) {
        setStatus("ready");
        setUrl(job.videoUrl);
        return; // terminal
      }
      if (job.status === "failed") {
        setStatus("failed");
        return; // terminal
      }
      if (job.status === "rendering") setStatus("rendering");

      timer = setTimeout(tick, INTERVAL_MS);
    };

    timer = setTimeout(tick, 1_500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, status, url]);

  return <VideoSlot status={status} url={url} repoName={repoName} />;
}
