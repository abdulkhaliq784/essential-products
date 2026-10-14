import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Landing point for links in Supabase emails (confirm sign-up, reset password).
 * Supports both link styles:
 *   ?code=...                      (default Supabase templates, PKCE flow)
 *   ?token_hash=...&type=recovery  (custom templates, see SETUP.md; works in any browser)
 * On success the user is logged in and sent to ?next=..., otherwise to /login with an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) {
    const destination = type === "recovery" ? "/reset-password" : next;
    return NextResponse.redirect(new URL(destination, origin));
  }
  return NextResponse.redirect(new URL("/login?error=link-expired", origin));
}
