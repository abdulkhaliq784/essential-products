import type { OrderStatus } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/** 29900 -> "₹299.00" */
export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

/** "₹299.00" -> 29900. Accepts "299", "299.5", "1,299.00". Returns NaN if invalid. */
export function rupeesToPaise(input: string): number {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  paid: "bg-green-50 text-green-700 ring-green-200",
  processing: "bg-blue-50 text-blue-700 ring-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  delivered: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  payment_failed: "bg-red-50 text-red-700 ring-red-200",
};
