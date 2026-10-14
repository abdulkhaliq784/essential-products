"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError, productSchema } from "@/lib/validation";

export type SaveProductResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Create (id = null) or update a product. Runs as the logged-in admin:
 * requireAdmin() checks the role, and RLS ("products: admin write") enforces it again.
 */
export async function saveProduct(id: string | null, input: unknown): Promise<SaveProductResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("products").update(parsed.data).eq("id", id).select("id, slug").single()
    : await supabase.from("products").insert(parsed.data).select("id, slug").single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Another product already uses this slug. Please choose a different one." };
    return { ok: false, error: `Could not save product: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}
