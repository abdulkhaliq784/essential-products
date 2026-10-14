"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Address } from "@/lib/types";
import { AddressForm, AddressText } from "@/components/address/AddressForm";
import { Alert, buttonClass } from "@/components/ui";

export function AddressBook({ userId, initialAddresses }: { userId: string; initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function upsertLocal(saved: Address) {
    setAddresses((list) => {
      const rest = list
        .filter((a) => a.id !== saved.id)
        .map((a) => (saved.is_default ? { ...a, is_default: false } : a));
      return saved.is_default ? [saved, ...rest] : [...rest, saved];
    });
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    setError(null);
    const { error } = await createClient().from("addresses").delete().eq("id", id);
    if (error) return setError("Could not delete the address. Please try again.");
    setAddresses((list) => list.filter((a) => a.id !== id));
  }

  if (editing) {
    return (
      <AddressForm
        userId={userId}
        initial={editing === "new" ? undefined : editing}
        makeDefault={addresses.length === 0}
        onSaved={upsertLocal}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {addresses.length === 0 ? (
        <p className="text-sm text-gray-600">You haven&apos;t saved any addresses yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-lg border border-gray-200 p-4">
              {a.is_default && (
                <span className="mb-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Default
                </span>
              )}
              <AddressText address={a} />
              <div className="mt-3 flex gap-4 text-sm">
                <button type="button" onClick={() => setEditing(a)} className="font-semibold text-red-600 hover:underline">
                  Edit
                </button>
                <button type="button" onClick={() => remove(a.id)} className="text-gray-600 hover:text-red-600">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setEditing("new")} className={buttonClass("secondary")}>
        + Add new address
      </button>
    </div>
  );
}
