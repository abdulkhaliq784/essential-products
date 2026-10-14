import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import type { Order, Product } from "@/lib/types";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { LOW_STOCK_THRESHOLD } from "@/components/product/StockBadge";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [toShip, lowStock, recent] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
    supabase
      .from("products")
      .select("id, name, stock")
      .lte("stock", LOW_STOCK_THRESHOLD)
      .eq("is_active", true)
      .order("stock"),
    supabase
      .from("orders")
      .select("id, order_number, status, total_paise, created_at, stock_short")
      .not("paid_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (recent.error) throw new Error(recent.error.message);

  const lowStockProducts = (lowStock.data ?? []) as Pick<Product, "id" | "name" | "stock">[];
  const recentOrders = (recent.data ?? []) as Pick<
    Order,
    "id" | "order_number" | "status" | "total_paise" | "created_at" | "stock_short"
  >[];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/orders?status=paid" className="rounded-xl border border-gray-200 p-5 hover:border-red-600">
          <p className="text-sm text-gray-600">Orders to pack &amp; ship</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{toShip.count ?? 0}</p>
        </Link>
        <Link href="/admin/products" className="rounded-xl border border-gray-200 p-5 hover:border-red-600">
          <p className="text-sm text-gray-600">Products low on stock (≤ {LOW_STOCK_THRESHOLD})</p>
          <p className={`mt-1 text-3xl font-bold ${lowStockProducts.length ? "text-red-600" : "text-gray-900"}`}>
            {lowStockProducts.length}
          </p>
        </Link>
      </div>

      {lowStockProducts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Low stock</h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {lowStockProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 hover:text-red-600">
                  {p.name}
                </Link>
                <span className={p.stock === 0 ? "font-semibold text-red-600" : "text-gray-700"}>{p.stock} left</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent paid orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-red-600 hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-600">No paid orders yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">
                    {o.order_number}
                    {o.stock_short && <span className="ml-2 text-xs font-semibold text-red-600">STOCK SHORT</span>}
                  </span>
                  <span className="text-gray-500">{formatDate(o.created_at)}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="font-semibold">{formatINR(o.total_paise)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
