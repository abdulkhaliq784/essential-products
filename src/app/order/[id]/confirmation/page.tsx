import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrderWithItems } from "@/lib/orders";
import { OrderDetails } from "@/components/order/OrderDetails";
import { buttonClass, Container } from "@/components/ui";
import { CheckCircleIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function ConfirmationPage({ params }: PageProps<"/order/[id]/confirmation">) {
  const { id } = await params;
  await requireUser(`/order/${id}/confirmation`);
  const order = await getOrderWithItems(id);
  if (!order) notFound();

  const confirmed = order.paid_at !== null;

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8 text-center">
        {confirmed ? (
          <>
            <CheckCircleIcon className="mx-auto h-14 w-14 text-green-600" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">Thank you! Your order is confirmed.</h1>
            <p className="mt-2 text-gray-600">
              We&apos;ve received your payment for order <strong>{order.order_number}</strong>. We&apos;ll start packing
              it right away.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">We&apos;re confirming your payment…</h1>
            <p className="mt-2 text-gray-600">
              This usually takes a few seconds. Please refresh this page shortly. You don&apos;t need to pay again.
            </p>
          </>
        )}
      </div>

      <OrderDetails order={order} />

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className={buttonClass("secondary")}>
          View my orders
        </Link>
        <Link href="/" className={buttonClass("primary")}>
          Continue shopping
        </Link>
      </div>
    </Container>
  );
}
