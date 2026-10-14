import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";
import { Alert, Container, PageTitle } from "@/components/ui";
import { ProfileForm } from "./ProfileForm";
import { AddressBook } from "./AddressBook";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);
  const supabase = await createClient();
  const { data: addresses, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Container className="py-8 sm:py-10">
      <PageTitle subtitle={user.email}>My account</PageTitle>

      {params.password === "updated" && (
        <div className="mb-6">
          <Alert kind="success">Your password has been updated.</Alert>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            <div className="mt-4">
              <ProfileForm userId={user.id} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Saved addresses</h2>
            <div className="mt-4">
              {error ? (
                <Alert>Could not load your addresses. Please refresh the page.</Alert>
              ) : (
                <AddressBook userId={user.id} initialAddresses={(addresses ?? []) as Address[]} />
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <Link
            href="/account/orders"
            className="block rounded-xl border border-gray-200 p-5 hover:border-red-600 hover:bg-red-50/40"
          >
            <p className="font-semibold text-gray-900">My orders</p>
            <p className="mt-1 text-sm text-gray-600">Track and view your past orders</p>
          </Link>
          <Link
            href="/forgot-password"
            className="block rounded-xl border border-gray-200 p-5 hover:border-red-600 hover:bg-red-50/40"
          >
            <p className="font-semibold text-gray-900">Change password</p>
            <p className="mt-1 text-sm text-gray-600">We&apos;ll email you a secure reset link</p>
          </Link>
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="block rounded-xl border border-red-200 bg-red-50 p-5 hover:border-red-600"
            >
              <p className="font-semibold text-red-700">Admin panel</p>
              <p className="mt-1 text-sm text-red-700/80">Manage products and orders</p>
            </Link>
          )}
        </aside>
      </div>
    </Container>
  );
}
