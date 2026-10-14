import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderWithItems } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import type { Payment, Profile } from "@/lib/types";
import { OrderDetails } from "@/components/order/OrderDetails";
import { Alert } from "@/components/ui";
import { StatusForm } from "./StatusForm";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await getOrderWithItems(id);
  if (!order) notFound();

  const supabase = await createClient();
  const [{ data: customer }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", order.user_id).maybeSingle<Pick<Profile, "full_name" | "phone">>(),
    supabase.from("payments").select("*").eq("order_id", order.id).order("created_at"),
  ]);

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-semibold text-red-600 hover:underline">
        ← All orders
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-gray-900">Order {order.order_number}</h1>

      {order.stock_short && (
        <div className="mb-6">
          <Alert>
            <strong>Stock short:</strong> this order was paid after stock had run out for one or more items. Restock and
            ship, or cancel the order and refund the customer from the Razorpay dashboard.
          </Alert>
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 p-5 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Update status</h2>
          <StatusForm key={order.status} orderId={order.id} current={order.status} />
        </section>
        <section className="rounded-xl border border-gray-200 p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Customer</h2>
          <p className="text-sm text-gray-700">{customer?.full_name ?? "-"}</p>
          {customer?.phone && <p className="text-sm text-gray-700">+91 {customer.phone}</p>}
        </section>
        <section className="rounded-xl border border-gray-200 p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Payment</h2>
          {payments && payments.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {(payments as Payment[]).map((p) => (
                <li key={p.id}>
                  <span className="font-mono text-xs">{p.razorpay_payment_id}</span>
                  <br />
                  {formatINR(p.amount_paise)} · {p.method ?? "-"} · {p.status}
                  <br />
                  <span className="text-xs text-gray-500">{formatDate(p.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No payment recorded.</p>
          )}
        </section>
      </div>

      <OrderDetails order={order} />
    </div>
  );
}
