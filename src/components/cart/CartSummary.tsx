import { formatINR } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/pricing";

export function CartSummary({
  subtotal,
  shipping,
  total,
  itemCount,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}) {
  const remaining = FREE_SHIPPING_THRESHOLD_PAISE - subtotal;
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-gray-600">
          Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
        </dt>
        <dd className="font-medium text-gray-900">{formatINR(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-gray-600">Shipping</dt>
        <dd className="font-medium text-gray-900">
          {shipping === 0 ? <span className="text-green-700">FREE</span> : formatINR(shipping)}
        </dd>
      </div>
      {shipping > 0 && remaining > 0 && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          Add {formatINR(remaining)} more to get <strong>free shipping</strong>.
        </p>
      )}
      <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
        <dt className="font-semibold text-gray-900">Total</dt>
        <dd className="font-bold text-gray-900">{formatINR(total)}</dd>
      </div>
      <p className="text-xs text-gray-500">Prices are inclusive of GST.</p>
    </dl>
  );
}
