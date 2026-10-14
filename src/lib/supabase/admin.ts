import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Service-role Supabase client. It BYPASSES Row Level Security, so it is only
 * used on the server for trusted operations (creating orders, marking them paid).
 * The "server-only" import makes the build fail if this is ever imported
 * into browser code.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
