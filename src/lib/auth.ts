import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** The logged-in user, verified with Supabase Auth (deduplicated per request). */
export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? { id: user.id, full_name: null, phone: null, role: "customer" };
});

/** Use in pages that need a logged-in user. */
export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Use in admin pages. The database (RLS) enforces the same rule independently. */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/?error=not-admin");
  return { user, profile };
}
