import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";
import { Container, PageTitle } from "@/components/ui";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Container className="py-8 sm:py-10">
      <PageTitle>Checkout</PageTitle>
      <CheckoutClient userId={user.id} initialAddresses={(addresses ?? []) as Address[]} />
    </Container>
  );
}
