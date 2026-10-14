"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { Alert, buttonClass, inputClass, Spinner } from "@/components/ui";
import { updateOrderStatus } from "../actions";

export function StatusForm({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(current);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      <div className="flex gap-2">
        <label htmlFor="status" className="sr-only">
          Order status
        </label>
        <select
          id="status"
          value={value}
          onChange={(e) => setValue(e.target.value as OrderStatus)}
          className={inputClass}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending || value === current}
          className={buttonClass("primary", "shrink-0")}
          onClick={() =>
            startTransition(async () => {
              const { error } = await updateOrderStatus(orderId, value);
              setMessage(error ? { kind: "error", text: error } : { kind: "success", text: "Status updated." });
              if (!error) router.refresh();
            })
          }
        >
          {isPending && <Spinner />}
          Update
        </button>
      </div>
    </div>
  );
}
