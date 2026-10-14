import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR, ORDER_STATUS_LABEL } from "@/lib/format";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Orders" };

type Row = Pick<
  Order,
  "id" | "order_number" | "status" | "total_paise" | "created_at" | "paid_at" | "stock_short" | "shipping_address"
>;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { status: statusParam } = await searchParams;
  const status = ORDER_STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : null;

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, status, total_paise, created_at, paid_at, stock_short, shipping_address")
    .order("created_at", { ascending: false })
    .limit(200);
  query = status ? query.eq("status", status) : query.not("paid_at", "is", null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const orders = data as Row[];

  const filters: { value: OrderStatus | null; label: string }[] = [
    { value: null, label: "All paid" },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Orders</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
            className={`rounded-full border px-3 py-1 text-sm ${
              status === f.value ? "border-red-600 bg-red-600 text-white" : "border-gray-300 text-gray-700 hover:border-red-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" description="Orders matching this filter will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-gray-900 hover:text-red-600">
                      {o.order_number}
                    </Link>
                    {o.stock_short && <p className="text-xs font-semibold text-red-600">Stock short: check</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.shipping_address.full_name}
                    <br />
                    <span className="text-xs">
                      {o.shipping_address.city}, {o.shipping_address.pincode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(o.total_paise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
