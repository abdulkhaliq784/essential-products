import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Container, EmptyState, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "My orders" };

type OrderRow = Pick<Order, "id" | "order_number" | "status" | "total_paise" | "created_at" | "paid_at"> & {
  order_items: { count: number }[];
};

export default async function MyOrdersPage() {
  const user = await requireUser("/account/orders");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_paise, created_at, paid_at, order_items(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load orders: ${error.message}`);

  // Hide abandoned checkout attempts (never paid and later cancelled).
  const orders = (data as OrderRow[]).filter((o) => !(o.status === "cancelled" && !o.paid_at));

  return (
    <Container className="py-8 sm:py-10">
      <PageTitle>My orders</PageTitle>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order, you'll be able to track it here."
          actionHref="/"
          actionLabel="Start shopping"
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const items = o.order_items[0]?.count ?? 0;
            return (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 hover:border-red-600 sm:p-5"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{o.order_number}</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {formatDate(o.created_at)} · {items} {items === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={o.status} />
                    <p className="font-semibold text-gray-900">{formatINR(o.total_paise)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
