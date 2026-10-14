"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { INDIAN_STATES } from "@/lib/indian-states";
import { addressSchema } from "@/lib/validation";
import type { Address } from "@/lib/types";
import { Alert, buttonClass, inputClass, labelClass, Spinner } from "@/components/ui";

type FieldErrors = Partial<Record<string, string>>;

/**
 * Create or edit a saved address (Indian format). Saves straight to the
 * "addresses" table; RLS guarantees users can only write their own rows,
 * and the table's CHECK constraints re-validate phone and PIN code.
 */
export function AddressForm({
  userId,
  initial,
  makeDefault = false,
  onSaved,
  onCancel,
  submitLabel = "Save address",
}: {
  userId: string;
  initial?: Address;
  makeDefault?: boolean;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = addressSchema.safeParse(raw);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) fe[String(issue.path[0])] ??= issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setFormError(null);
    setSaving(true);

    const supabase = createClient();
    const isDefault = raw.is_default === "on" || makeDefault;
    if (isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }
    const row = { ...parsed.data, user_id: userId, is_default: isDefault };
    const { data, error } = initial
      ? await supabase.from("addresses").update(row).eq("id", initial.id).select().single()
      : await supabase.from("addresses").insert(row).select().single();

    setSaving(false);
    if (error) {
      setFormError("Could not save the address. Please check the details and try again.");
      return;
    }
    onSaved(data as Address);
  }

  const field = (name: string) => ({
    id: `addr-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `addr-${name}-error` : undefined,
    className: `${inputClass} ${errors[name] ? "border-red-500" : ""}`,
  });
  const err = (name: string) =>
    errors[name] && (
      <p id={`addr-${name}-error`} className="mt-1 text-xs text-red-600">
        {errors[name]}
      </p>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && <Alert>{formError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="addr-full_name" className={labelClass}>
            Full name
          </label>
          <input {...field("full_name")} autoComplete="name" defaultValue={initial?.full_name} />
          {err("full_name")}
        </div>
        <div>
          <label htmlFor="addr-phone" className={labelClass}>
            Mobile number
          </label>
          <input
            {...field("phone")}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="10-digit mobile number"
            defaultValue={initial?.phone}
          />
          {err("phone")}
        </div>
      </div>
      <div>
        <label htmlFor="addr-line1" className={labelClass}>
          Flat / House no., Building, Street
        </label>
        <input {...field("line1")} autoComplete="address-line1" defaultValue={initial?.line1} />
        {err("line1")}
      </div>
      <div>
        <label htmlFor="addr-line2" className={labelClass}>
          Area, Colony, Sector <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input {...field("line2")} autoComplete="address-line2" defaultValue={initial?.line2 ?? ""} />
      </div>
      <div>
        <label htmlFor="addr-landmark" className={labelClass}>
          Landmark <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input {...field("landmark")} placeholder="e.g. Near City Hospital" defaultValue={initial?.landmark ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="addr-pincode" className={labelClass}>
            PIN code
          </label>
          <input
            {...field("pincode")}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            defaultValue={initial?.pincode}
          />
          {err("pincode")}
        </div>
        <div>
          <label htmlFor="addr-city" className={labelClass}>
            Town / City
          </label>
          <input {...field("city")} autoComplete="address-level2" defaultValue={initial?.city} />
          {err("city")}
        </div>
        <div>
          <label htmlFor="addr-state" className={labelClass}>
            State
          </label>
          <select {...field("state")} autoComplete="address-level1" defaultValue={initial?.state ?? ""}>
            <option value="" disabled>
              Select state
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {err("state")}
        </div>
      </div>
      {!makeDefault && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="is_default"
            defaultChecked={initial?.is_default}
            className="h-4 w-4 rounded border-gray-300 accent-red-600"
          />
          Make this my default address
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className={buttonClass("primary")}>
          {saving && <Spinner />}
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function AddressText({ address }: { address: Omit<Address, "id" | "user_id" | "is_default"> }) {
  return (
    <address className="not-italic text-sm leading-relaxed text-gray-700">
      <span className="font-semibold text-gray-900">{address.full_name}</span>
      <br />
      {address.line1}
      {address.line2 && <>, {address.line2}</>}
      {address.landmark && (
        <>
          <br />
          Landmark: {address.landmark}
        </>
      )}
      <br />
      {address.city}, {address.state} {address.pincode}
      <br />
      Phone: +91 {address.phone}
    </address>
  );
}
