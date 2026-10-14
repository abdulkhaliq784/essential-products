"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";
import type { CartLine } from "@/lib/types";

/*
 * Cart state for the whole site.
 *  - Guests: { productId, quantity } pairs are kept in localStorage.
 *  - Logged in: rows in the cart_items table (RLS: users only see their own rows).
 *  - On login, the guest cart is merged into the account cart, then cleared locally.
 * Product details (price, stock) are always loaded fresh from the database.
 * Prices shown here are for display only; checkout recalculates on the server.
 */

type StoredItem = { productId: string; quantity: number };
const STORAGE_KEY = "ep_cart_v1";
const PRODUCT_FIELDS = "id, slug, name, price_paise, mrp_paise, stock, images, is_active";

function readLocal(): StoredItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is StoredItem => typeof i?.productId === "string" && Number.isInteger(i?.quantity) && i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeLocal(items: StoredItem[]) {
  try {
    if (items.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private mode / storage disabled: cart simply won't persist across reloads.
  }
}

const clampQty = (qty: number, stock: number) => Math.max(0, Math.min(qty, stock, MAX_QTY_PER_ITEM));

interface CartContextValue {
  lines: CartLine[];
  count: number;
  status: "loading" | "ready" | "error";
  error: string | null;
  isLoggedIn: boolean;
  addItem: (product: { id: string; stock: number }, quantity: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  reload: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ initialUserId, children }: { initialUserId: string | null; children: ReactNode }) {
  const supabase = useMemo(() => (isSupabaseConfigured ? createClient() : null), []);
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<CartContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  // Keep userId in sync with Supabase auth (login / logout in this or another tab).
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const loadLines = useCallback(
    async (uid: string | null) => {
      if (!supabase) {
        setLines([]);
        setStatus("ready");
        return;
      }
      try {
        if (uid) {
          const { data, error: err } = await supabase
            .from("cart_items")
            .select(`quantity, product:products (${PRODUCT_FIELDS})`)
            .eq("user_id", uid)
            .order("created_at");
          if (err) throw err;
          const rows = (data ?? []) as unknown as { quantity: number; product: CartLine["product"] | null }[];
          // product is null if it was deactivated (RLS hides it) - drop those lines.
          setLines(rows.filter((r) => r.product).map((r) => ({ product: r.product!, quantity: r.quantity })));
        } else {
          const local = readLocal();
          if (local.length === 0) {
            setLines([]);
          } else {
            const { data, error: err } = await supabase
              .from("products")
              .select(PRODUCT_FIELDS)
              .in("id", local.map((i) => i.productId));
            if (err) throw err;
            const products = (data ?? []) as CartLine["product"][];
            const next = local
              .map((i) => ({ product: products.find((p) => p.id === i.productId), quantity: i.quantity }))
              .filter((l): l is CartLine => Boolean(l.product));
            writeLocal(next.map((l) => ({ productId: l.product.id, quantity: l.quantity })));
            setLines(next);
          }
        }
        setError(null);
        setStatus("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your cart");
        setStatus("error");
      }
    },
    [supabase],
  );

  /** After login: move guest items into the account cart (adding quantities, capped at stock). */
  const mergeGuestCart = useCallback(
    async (uid: string) => {
      const local = readLocal();
      if (!supabase || local.length === 0) return;
      const ids = local.map((i) => i.productId);
      const [{ data: existing }, { data: products }] = await Promise.all([
        supabase.from("cart_items").select("product_id, quantity").eq("user_id", uid).in("product_id", ids),
        supabase.from("products").select("id, stock").in("id", ids),
      ]);
      const rows = local
        .map((i) => {
          const stock = products?.find((p) => p.id === i.productId)?.stock ?? 0;
          const current = existing?.find((e) => e.product_id === i.productId)?.quantity ?? 0;
          return { user_id: uid, product_id: i.productId, quantity: clampQty(current + i.quantity, stock) };
        })
        .filter((r) => r.quantity > 0);
      if (rows.length > 0) {
        const { error: err } = await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,product_id" });
        if (err) throw err;
      }
      writeLocal([]);
    },
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      if (userId) {
        try {
          await mergeGuestCart(userId);
        } catch {
          // Merge failure shouldn't block showing the account cart; guest items stay in localStorage.
        }
      }
      if (!cancelled) await loadLines(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loadLines, mergeGuestCart]);

  const writeQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!supabase) return;
      if (userId) {
        const { error: err } =
          quantity > 0
            ? await supabase
                .from("cart_items")
                .upsert({ user_id: userId, product_id: productId, quantity }, { onConflict: "user_id,product_id" })
            : await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
        if (err) throw new Error(err.message);
      } else {
        const items = readLocal().filter((i) => i.productId !== productId);
        if (quantity > 0) items.push({ productId, quantity });
        writeLocal(items);
      }
      await loadLines(userId);
    },
    [supabase, userId, loadLines],
  );

  const addItem = useCallback(
    async (product: { id: string; stock: number }, quantity: number) => {
      const current = linesRef.current.find((l) => l.product.id === product.id)?.quantity ?? 0;
      const next = clampQty(current + quantity, product.stock);
      if (next === current) {
        throw new Error(
          product.stock <= 0
            ? "This product is out of stock."
            : `You can add up to ${Math.min(product.stock, MAX_QTY_PER_ITEM)} of this item.`,
        );
      }
      await writeQuantity(product.id, next);
    },
    [writeQuantity],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const line = linesRef.current.find((l) => l.product.id === productId);
      await writeQuantity(productId, line ? clampQty(quantity, line.product.stock) : quantity);
    },
    [writeQuantity],
  );

  const removeItem = useCallback((productId: string) => writeQuantity(productId, 0), [writeQuantity]);
  const reload = useCallback(() => loadLines(userId), [loadLines, userId]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      status,
      error,
      isLoggedIn: Boolean(userId),
      addItem,
      setQuantity,
      removeItem,
      reload,
    }),
    [lines, status, error, userId, addItem, setQuantity, removeItem, reload],
  );

  return <CartContext value={value}>{children}</CartContext>;
}
