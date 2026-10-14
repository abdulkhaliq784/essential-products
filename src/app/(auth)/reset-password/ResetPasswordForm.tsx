"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== form.get("confirmPassword")) return setError("Passwords do not match.");

    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/account?password=updated");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm new password
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClass} />
      </div>
      <button type="submit" disabled={loading} className={buttonClass("primary", "w-full py-3")}>
        {loading && <Spinner />}
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
