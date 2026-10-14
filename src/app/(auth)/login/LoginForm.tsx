"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    if (error) {
      setError(
        error.message === "Email not confirmed"
          ? "Please confirm your email first. Check your inbox for the confirmation link."
          : "Incorrect email or password.",
      );
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isSupabaseConfigured && <Alert kind="info">Login is unavailable until Supabase is configured.</Alert>}
      {error && <Alert>{error}</Alert>}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <Link href="/forgot-password" className="mb-1 text-sm text-red-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={loading || !isSupabaseConfigured} className={buttonClass("primary", "w-full py-3")}>
        {loading && <Spinner />}
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
