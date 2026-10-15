import "server-only";
import { NextResponse } from "next/server";

/**
 * Checks the server-side settings needed for checkout. Problems are logged with the
 * exact variable name (visible in the terminal / Vercel Logs); customers only see a
 * generic message, so configuration details are never exposed publicly.
 */
export function paymentConfigProblems(): string[] {
  const problems: string[] = [];
  const env = (name: string) => process.env[name]?.trim() ?? "";

  for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]) {
    if (!env(name)) problems.push(`${name} is not set`);
  }
  if (env("RAZORPAY_KEY_ID") && !/^rzp_(test|live)_/.test(env("RAZORPAY_KEY_ID"))) {
    problems.push("RAZORPAY_KEY_ID should start with rzp_test_ or rzp_live_");
  }
  if (env("RAZORPAY_KEY_SECRET").startsWith("rzp_")) {
    problems.push("RAZORPAY_KEY_SECRET looks like a Key ID (starts with rzp_); paste the Key Secret instead");
  }
  if (env("RAZORPAY_KEY_SECRET") && env("RAZORPAY_KEY_SECRET") === env("RAZORPAY_KEY_ID")) {
    problems.push("RAZORPAY_KEY_SECRET is the same as RAZORPAY_KEY_ID");
  }
  return problems;
}

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Returns a 503 response if checkout is misconfigured, otherwise null. */
export function checkPaymentConfig(): NextResponse | null {
  const problems = paymentConfigProblems();
  if (problems.length === 0) return null;
  console.error(`[checkout] Server configuration problem: ${problems.join("; ")}`);
  return jsonError(503, "Online payment isn't set up correctly on our server yet. Please try again later.");
}

/** Wraps a route handler so unexpected errors still return JSON instead of an empty 500. */
export function withJsonErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e) {
      console.error("[api] Unhandled error", e);
      return jsonError(500, "Something went wrong on our side. Please try again in a moment.");
    }
  };
}
