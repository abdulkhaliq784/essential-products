"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { signupSchema, firstError } from "@/lib/validation";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = signupSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }
    const { fullName, phone, email, password } = parsed.data;

    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || null },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      // Email confirmation is turned off in Supabase: the user is logged in immediately.
      router.replace(next);
      router.refresh();
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <Alert kind="success">
        <p className="font-semibold">Check your email</p>
        <p className="mt-1">
          We sent a confirmation link to <strong>{sentTo}</strong>. Click it to activate your account, then you&apos;ll
          be logged in automatically.
        </p>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {!isSupabaseConfigured && <Alert kind="info">Sign up is unavailable until Supabase is configured.</Alert>}
      {error && <Alert>{error}</Alert>}
      <div>
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input id="fullName" name="fullName" autoComplete="name" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>
          Mobile number <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
            +91
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            className={`${inputClass} rounded-l-none`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={loading || !isSupabaseConfigured} className={buttonClass("primary", "w-full py-3")}>
        {loading && <Spinner />}
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
