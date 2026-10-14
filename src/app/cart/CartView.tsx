"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { Alert, buttonClass, EmptyState, Skeleton } from "@/components/ui";
import { TrashIcon } from "@/components/icons";
import { formatINR } from "@/lib/format";
import { calculateTotals, MAX_QTY_PER_ITEM } from "@/lib/pricing";

export function CartView() {
  const { lines, count, status, error, isLoggedIn, setQuantity, removeItem, reload } = useCart();
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(productId: string, action: () => Promise<void>) {
    setBusy(productId);
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading" && lines.length === 0) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-24 w-24" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <Alert>We couldn&apos;t load your cart. {error}</Alert>
        <button type="button" onClick={() => reload()} className={buttonClass("secondary")}>
          Try again
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Looks like you haven't added anything yet. Explore our everyday essentials."
        actionHref="/"
        actionLabel="Start shopping"
      />
    );
  }

  const outOfStock = lines.filter((l) => l.product.stock <= 0);
  const overStock = lines.filter((l) => l.product.stock > 0 && l.quantity > l.product.stock);
  const canCheckout = outOfStock.length === 0 && overStock.length === 0;
  const totals = calculateTotals(lines.map((l) => ({ unitPricePaise: l.product.price_paise, quantity: l.quantity })));

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2" aria-label="Cart items">
        {actionError && (
          <div className="mb-4">
            <Alert>{actionError}</Alert>
          </div>
        )}
        {!canCheckout && (
          <div className="mb-4">
            <Alert>
              Some items are no longer available in the quantity you selected. Please update or remove them to continue.
            </Alert>
          </div>
        )}
        <ul className="divide-y divide-gray-200 border-y border-gray-200">
          {lines.map(({ product, quantity }) => {
            const unavailable = product.stock <= 0;
            const tooMany = !unavailable && quantity > product.stock;
            return (
              <li key={product.id} className={`flex gap-4 py-5 ${busy === product.id ? "opacity-60" : ""}`}>
                <Link href={`/product/${product.slug}`} className="w-20 shrink-0 sm:w-28">
                  <ProductImage src={product.images[0]} alt={product.name} sizes="112px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <Link
                      href={`/product/${product.slug}`}
                      className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-red-600 sm:text-base"
                    >
                      {product.name}
                    </Link>
                    <p className="shrink-0 text-sm font-semibold text-gray-900 sm:text-base">
                      {formatINR(product.price_paise * quantity)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{formatINR(product.price_paise)} each</p>
                  {unavailable && <p className="mt-1 text-sm font-medium text-red-600">Out of stock</p>}
                  {tooMany && (
                    <p className="mt-1 text-sm font-medium text-red-600">Only {product.stock} left in stock</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    {unavailable ? (
                      <span />
                    ) : (
                      <QuantitySelector
                        size="sm"
                        value={quantity}
                        max={Math.min(product.stock, MAX_QTY_PER_ITEM)}
                        disabled={busy === product.id}
                        onChange={(v) => run(product.id, () => setQuantity(product.id, v))}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => run(product.id, () => removeItem(product.id))}
                      disabled={busy === product.id}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-red-600 hover:underline">
          ← Continue shopping
        </Link>
      </section>

      <aside className="h-fit rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order summary</h2>
        <CartSummary {...totals} itemCount={count} />
        {canCheckout ? (
          <Link href="/checkout" className={buttonClass("primary", "mt-6 w-full py-3 text-base")}>
            {isLoggedIn ? "Proceed to checkout" : "Login & checkout"}
          </Link>
        ) : (
          <button type="button" disabled className={buttonClass("primary", "mt-6 w-full py-3 text-base")}>
            Proceed to checkout
          </button>
        )}
        {!isLoggedIn && (
          <p className="mt-3 text-center text-xs text-gray-500">Your cart will be saved to your account when you log in.</p>
        )}
      </aside>
    </div>
  );
}
