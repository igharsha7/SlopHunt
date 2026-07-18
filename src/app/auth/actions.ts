"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Kick off GitHub OAuth. We ask for `read:user` only — enough to know who you
 * are and which repos you own, nothing that would let us write to your account.
 */
export async function signInWithGitHub(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const next = (formData.get("next") as string | null) ?? "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "read:user",
    },
  });

  if (error || !data.url) {
    redirect(`/?auth_error=${encodeURIComponent(error?.message ?? "unknown")}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
