import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth landing point. Supabase hands us a `code`, we swap it for a session
 * cookie, then mirror the GitHub identity into public.users so submissions can
 * be attributed for the ownership check (safety rail 1).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const oauthError = searchParams.get("error_description");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error.message)}`,
    );
  }

  const identity = data.user?.user_metadata as
    | { user_name?: string; avatar_url?: string; provider_id?: string }
    | undefined;

  if (identity?.user_name && identity.provider_id) {
    // Best-effort: a failed mirror shouldn't block the login.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    try {
      await createAdminClient()
        .from("users")
        .upsert(
          {
            github_id: Number(identity.provider_id),
            github_login: identity.user_name,
            avatar_url: identity.avatar_url ?? null,
          },
          { onConflict: "github_id" },
        );
    } catch {
      // SUPABASE_SECRET_KEY not configured yet — session is still valid.
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
