import type { Metadata } from "next";
import { Container, PageTitle } from "@/components/ui";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <Container className="py-8 sm:py-10">
      <PageTitle>Your cart</PageTitle>
      <CartView />
    </Container>
  );
}
