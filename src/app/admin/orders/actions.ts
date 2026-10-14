"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { orderStatusSchema } from "@/lib/validation";

/**
 * Change an order's status. Runs as the admin user: RLS ("orders: admin update")
 * allows it, and the restrict_order_update trigger ensures only the status column changes.
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status: parsed.data }).eq("id", orderId);
  if (error) return { error: `Could not update status: ${error.message}` };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { error: null };
}
