import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Service-role client. BYPASSES RLS — never import this into a Client Component
 * or anything that ships to the browser. `server-only` makes that a build error.
 *
 * Use it for the agent pipeline: writing crawls, scores, roasts and video status
 * on behalf of the system rather than a logged-in user.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Grab it from the Supabase dashboard " +
        "(Project Settings → API Keys → secret) and add it to .env.local.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
