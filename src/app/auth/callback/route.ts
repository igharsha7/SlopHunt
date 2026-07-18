import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * OAuth landing point. Supabase hands us a `code`, we swap it for a session
 * and mirror the GitHub identity into public.users so submissions can be
 * attributed for the ownership check (safety rail 1).
 *
 * The client is bound to the *response* we return, not to `cookies()`. That
 * matters: `exchangeCodeForSession` writes the session cookies during the
 * call, and a freshly-constructed `NextResponse.redirect()` does not inherit
 * them — the user lands back on the site logged out and gets asked to sign in
 * again. Building the redirect first and writing cookies onto it is what makes
 * the session survive the hop.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const oauthError = searchParams.get("error_description");

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(reason)}`);

  if (oauthError) return fail(oauthError);
  if (!code) return fail("missing_code");

  // Build the response up front so cookies can be attached to it.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(error.message);

  const identity = data.user?.user_metadata as
    | { user_name?: string; avatar_url?: string; provider_id?: string }
    | undefined;

  if (identity?.user_name && identity.provider_id) {
    // Best-effort: a failed mirror must not block a valid login.
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
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
      // SUPABASE_SECRET_KEY absent or users table missing — session still valid.
    }
  }

  return response;
}
