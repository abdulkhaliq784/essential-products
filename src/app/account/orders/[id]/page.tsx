import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrderWithItems } from "@/lib/orders";
import { OrderDetails } from "@/components/order/OrderDetails";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrderWithItems(id);
  // RLS already restricts to own orders; the extra check keeps admins on the admin view.
  if (!order || order.user_id !== user.id) notFound();

  return (
    <Container className="py-8 sm:py-10">
      <Link href="/account/orders" className="text-sm font-semibold text-red-600 hover:underline">
        ← All orders
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-gray-900">Order details</h1>
      <OrderDetails order={order} />
    </Container>
  );
}
