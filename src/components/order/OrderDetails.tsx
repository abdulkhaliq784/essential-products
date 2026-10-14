import { AddressText } from "@/components/address/AddressForm";
import { ProductImage } from "@/components/product/ProductImage";
import { formatDate, formatINR } from "@/lib/format";
import type { OrderWithItems } from "@/lib/orders";
import { OrderStatusBadge } from "./OrderStatusBadge";

/** Items, totals and address for one order. Used by customers and the admin panel. */
export function OrderDetails({ order }: { order: OrderWithItems }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-gray-200 p-5 sm:p-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">Order number</p>
            <p className="font-semibold text-gray-900">{order.order_number}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-2 text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>

        <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="w-14 shrink-0">
                <ProductImage src={item.product_image ?? undefined} alt="" sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-gray-900">{item.product_name}</p>
                <p className="text-sm text-gray-600">
                  {item.quantity} × {formatINR(item.unit_price_paise)}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatINR(item.line_total_paise)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>{formatINR(order.subtotal_paise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Shipping</dt>
            <dd>{order.shipping_paise === 0 ? "FREE" : formatINR(order.shipping_paise)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900">
            <dt>Total</dt>
            <dd>{formatINR(order.total_paise)}</dd>
          </div>
        </dl>
      </section>

      <aside className="h-fit rounded-xl border border-gray-200 p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Delivery address</h2>
        <AddressText address={order.shipping_address} />
        {order.paid_at && <p className="mt-4 text-sm text-gray-600">Paid on {formatDate(order.paid_at)}</p>}
      </aside>
    </div>
  );
}
