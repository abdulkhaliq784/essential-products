"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";
import { AuthCard } from "../AuthCard";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    // Don't reveal whether the email exists; only surface rate-limit style errors.
    if (error && error.status === 429) {
      setError("Too many requests. Please wait a minute and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      {sent ? (
        <Alert kind="success">
          If an account exists for that email, a password reset link is on its way. Please check your inbox (and spam
          folder).
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
          </div>
          <button type="submit" disabled={loading} className={buttonClass("primary", "w-full py-3")}>
            {loading && <Spinner />}
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-red-600 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
