import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ORDER_STATUS_STYLE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
