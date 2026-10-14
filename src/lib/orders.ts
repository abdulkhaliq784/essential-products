import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";

export type OrderWithItems = Order & { order_items: OrderItem[] };

/** Load one order with its items as the current user (RLS: own orders, or any order for admins). */
export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("*, order_items (*)").eq("id", orderId).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data as OrderWithItems | null;
}
