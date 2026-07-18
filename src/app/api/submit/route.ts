import { NextResponse, type NextRequest } from "next/server";

import { intake, runPipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The crawl + roast happen inside the request — allow up to a minute.
export const maxDuration = 60;

const REPO_RE = /^([\w.-]+)\/([\w.-]+)$/;

/**
 * POST /api/submit { repo: "owner/name" }
 * Intake gate (spec §7: ownership OR roast-me topic) → full pipeline →
 * { slug } for the instant page.
 */
export async function POST(request: NextRequest) {
  let body: { repo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send JSON: { repo: 'owner/name' }" }, { status: 400 });
  }

  const match = body.repo?.trim().match(REPO_RE);
  if (!match) {
    return NextResponse.json(
      { error: "That's not owner/name. Try github.com/you/your-repo." },
      { status: 400 },
    );
  }
  const [, owner, name] = match;

  // Who's asking? (Session is optional — the roast-me topic path needs none.)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const login = (user?.user_metadata?.user_name as string | undefined) ?? null;

  const gate = await intake(owner, name, login);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  // Resolve the submitter's row for attribution (best effort).
  let submitterId: string | null = null;
  try {
    if (login) {
      const { data } = await createAdminClient()
        .from("users")
        .select("id")
        .eq("github_login", login)
        .maybeSingle();
      submitterId = data?.id ?? null;
    }
  } catch {
    // users table not migrated yet — attribution can wait, the roast can't.
  }

  try {
    const { slug } = await runPipeline(gate.meta, submitterId);
    return NextResponse.json({ slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "pipeline failed";
    if (message.includes("SUPABASE_SECRET_KEY")) {
      return NextResponse.json(
        {
          error:
            "The database isn't wired up yet — SUPABASE_SECRET_KEY is missing on the server.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "The pipeline choked mid-roast. Try again in a minute." },
      { status: 500 },
    );
  }
}
