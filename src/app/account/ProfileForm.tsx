"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone, PHONE_REGEX } from "@/lib/validation";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";

export function ProfileForm({ userId, fullName, phone }: { userId: string; fullName: string; phone: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("full_name")).trim();
    const phoneValue = normalizePhone(String(form.get("phone")));
    if (name.length < 2) return setMessage({ kind: "error", text: "Please enter your full name." });
    if (phoneValue && !PHONE_REGEX.test(phoneValue))
      return setMessage({ kind: "error", text: "Enter a valid 10-digit Indian mobile number." });

    setSaving(true);
    setMessage(null);
    const { error } = await createClient()
      .from("profiles")
      .update({ full_name: name, phone: phoneValue || null })
      .eq("id", userId);
    setSaving(false);
    if (error) return setMessage({ kind: "error", text: "Could not save your profile. Please try again." });
    setMessage({ kind: "success", text: "Profile saved." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <input id="full_name" name="full_name" defaultValue={fullName} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Mobile number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            defaultValue={phone}
            autoComplete="tel-national"
            className={inputClass}
          />
        </div>
      </div>
      <button type="submit" disabled={saving} className={buttonClass("primary")}>
        {saving && <Spinner />}
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
