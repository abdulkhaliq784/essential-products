"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { AddressForm, AddressText } from "@/components/address/AddressForm";
import { ProductImage } from "@/components/product/ProductImage";
import { Alert, buttonClass, EmptyState, Skeleton, Spinner } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { formatINR } from "@/lib/format";
import { calculateTotals } from "@/lib/pricing";
import { loadRazorpay, type RazorpaySuccessResponse } from "@/lib/load-razorpay";
import type { Address } from "@/lib/types";

type Step = "idle" | "creating" | "paying" | "verifying";

/** Parse a JSON API response; if the server sent no/invalid JSON, return a friendly error instead of throwing. */
async function readJson<T>(res: Response): Promise<T & { error?: string }> {
  try {
    return await res.json();
  } catch {
    return { error: `Our server didn't respond properly (error ${res.status}). Please try again in a moment.` } as T & {
      error?: string;
    };
  }
}

type CreateOrderResponse = {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  prefill: { name?: string; email?: string; contact?: string };
};

export function CheckoutClient({ userId, initialAddresses }: { userId: string; initialAddresses: Address[] }) {
  const router = useRouter();
  const { lines, count, status, reload } = useCart();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedId, setSelectedId] = useState<string | null>(initialAddresses[0]?.id ?? null);
  const [addingAddress, setAddingAddress] = useState(initialAddresses.length === 0);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "loading" && lines.length === 0) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (lines.length === 0 && step === "idle") {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add some products to your cart before checking out."
        actionHref="/"
        actionLabel="Start shopping"
      />
    );
  }

  const totals = calculateTotals(lines.map((l) => ({ unitPricePaise: l.product.price_paise, quantity: l.quantity })));
  const busy = step !== "idle";

  async function verify(response: RazorpaySuccessResponse) {
    setStep("verifying");
    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const data = await readJson<{ orderId: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Payment verification failed.");
      await reload();
      router.push(`/order/${data.orderId}/confirmation`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment verification failed.");
      setStep("idle");
    }
  }

  async function placeOrder() {
    if (!selectedId) {
      setError("Please choose a delivery address.");
      return;
    }
    setError(null);
    setStep("creating");

    try {
      const [scriptLoaded, res] = await Promise.all([
        loadRazorpay(),
        fetch("/api/checkout/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addressId: selectedId }),
        }),
      ]);
      const data = await readJson<CreateOrderResponse>(res);
      if (!res.ok) {
        if (res.status === 409) await reload(); // stock/price changed: refresh the cart view
        throw new Error(data.error ?? "Could not start payment.");
      }
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Could not load the payment window. Please check your connection and try again.");
      }

      setStep("paying");
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "Essential Products",
        description: `Order ${data.orderNumber}`,
        prefill: data.prefill,
        theme: { color: "#dc2626" },
        handler: (response) => void verify(response),
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setStep("idle");
            setError("Payment was cancelled. Your cart is saved; you can try again whenever you're ready.");
          },
        },
      });
      rzp.on("payment.failed", (response) => {
        setError(
          `Payment failed${response.error?.description ? `: ${response.error.description}` : ""}. You can retry in the payment window or choose another method.`,
        );
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStep("idle");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Address */}
        <section className="rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">1. Delivery address</h2>
          <div className="mt-4">
            {addingAddress ? (
              <AddressForm
                userId={userId}
                makeDefault={addresses.length === 0}
                submitLabel="Save and deliver here"
                onSaved={(a) => {
                  setAddresses((list) => [a, ...list.map((x) => (a.is_default ? { ...x, is_default: false } : x))]);
                  setSelectedId(a.id);
                  setAddingAddress(false);
                }}
                onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
              />
            ) : (
              <div className="space-y-3">
                <fieldset className="grid gap-3 sm:grid-cols-2" disabled={busy}>
                  <legend className="sr-only">Choose a delivery address</legend>
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                        selectedId === a.id ? "border-red-600 bg-red-50/40 ring-1 ring-red-600" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={a.id}
                        checked={selectedId === a.id}
                        onChange={() => setSelectedId(a.id)}
                        className="mt-1 h-4 w-4 accent-red-600"
                      />
                      <AddressText address={a} />
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  onClick={() => setAddingAddress(true)}
                  disabled={busy}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  + Add a new address
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Items */}
        <section className="rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">2. Review items</h2>
            <Link href="/cart" className="text-sm font-semibold text-red-600 hover:underline">
              Edit cart
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-gray-100">
            {lines.map(({ product, quantity }) => (
              <li key={product.id} className="flex items-center gap-4 py-3">
                <div className="w-14 shrink-0">
                  <ProductImage src={product.images[0]} alt="" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {quantity} × {formatINR(product.price_paise)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatINR(product.price_paise * quantity)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Summary + pay */}
      <aside className="h-fit rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">3. Payment</h2>
        <CartSummary {...totals} itemCount={count} />
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}
        <button
          type="button"
          onClick={placeOrder}
          disabled={busy || addingAddress || !selectedId}
          className={buttonClass("primary", "mt-6 w-full py-3 text-base")}
        >
          {busy && <Spinner />}
          {step === "creating"
            ? "Preparing payment…"
            : step === "paying"
              ? "Waiting for payment…"
              : step === "verifying"
                ? "Confirming payment…"
                : `Pay ${formatINR(totals.total)}`}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <ShieldIcon className="h-4 w-4" /> Secure payment by Razorpay: UPI, cards, netbanking
        </p>
        <p className="mt-2 text-center text-xs text-gray-500">
          The final amount is calculated securely on our server.
        </p>
      </aside>
    </div>
  );
}
