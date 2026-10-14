"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartIcon } from "@/components/icons";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative rounded-full p-2 text-gray-700 hover:bg-gray-100 hover:text-red-600"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
