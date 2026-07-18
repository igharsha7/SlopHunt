import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/react { entryId, fingerprint, on }
 * The 💀 button. One reaction per visitor fingerprint per repo, enforced by
 * the unique constraint; skull_count is recomputed from the table so the
 * number can't drift.
 */
export async function POST(request: NextRequest) {
  let body: { entryId?: string; fingerprint?: string; on?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { entryId, fingerprint, on } = body;
  if (!entryId || !fingerprint || typeof on !== "boolean") {
    return NextResponse.json({ error: "entryId, fingerprint, on required" }, { status: 400 });
  }
  if (fingerprint.length > 64) {
    return NextResponse.json({ error: "fingerprint too long" }, { status: 400 });
  }

  try {
    const db = createAdminClient();

    if (on) {
      // Unique constraint makes duplicates a no-op.
      await db
        .from("reactions")
        .upsert(
          { repo_id: entryId, fingerprint },
          { onConflict: "repo_id,fingerprint", ignoreDuplicates: true },
        );
    } else {
      await db
        .from("reactions")
        .delete()
        .eq("repo_id", entryId)
        .eq("fingerprint", fingerprint);
    }

    const { count } = await db
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("repo_id", entryId);

    const skulls = count ?? 0;
    await db.from("repos").update({ skull_count: skulls }).eq("id", entryId);

    return NextResponse.json({ skulls });
  } catch {
    return NextResponse.json({ error: "reactions unavailable" }, { status: 503 });
  }
}
