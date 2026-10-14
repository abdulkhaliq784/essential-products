// Public (browser-safe) configuration. Server-only secrets are read where they
// are used (lib/supabase/admin.ts, lib/razorpay.ts) so they never reach the client.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const RAZORPAY_PUBLIC_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
