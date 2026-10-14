"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { buttonClass, Spinner } from "@/components/ui";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";
import { QuantitySelector } from "./QuantitySelector";

export function AddToCart({ product }: { product: { id: string; stock: number } }) {
  const { addItem, lines } = useCart();
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  const inCart = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
  const maxAddable = Math.max(0, Math.min(product.stock, MAX_QTY_PER_ITEM) - inCart);

  if (product.stock <= 0) {
    return (
      <button type="button" disabled className={buttonClass("primary", "w-full sm:w-auto")}>
        Out of stock
      </button>
    );
  }

  async function handleAdd() {
    setError(null);
    setState("adding");
    try {
      await addItem(product, qty);
      setState("added");
      setQty(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to cart. Please try again.");
      setState("idle");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector
          value={Math.min(qty, Math.max(maxAddable, 1))}
          max={Math.max(maxAddable, 1)}
          onChange={(v) => {
            setQty(v);
            setState("idle");
          }}
          disabled={maxAddable === 0 || state === "adding"}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={maxAddable === 0 || state === "adding"}
          className={buttonClass("primary", "h-11 flex-1 sm:flex-none sm:px-8")}
        >
          {state === "adding" && <Spinner />}
          {state === "adding" ? "Adding…" : "Add to cart"}
        </button>
      </div>

      {maxAddable === 0 && inCart > 0 && (
        <p className="text-sm text-gray-600">You already have the maximum quantity of this item in your cart.</p>
      )}
      {state === "added" && (
        <p className="text-sm text-green-700" role="status">
          Added to cart.{" "}
          <Link href="/cart" className="font-semibold text-red-600 underline underline-offset-2">
            View cart
          </Link>
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
