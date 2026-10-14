import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

// Catalog queries. They run as the current visitor, so RLS only returns
// active products to customers. Errors are thrown and caught by error.tsx.

const PRODUCT_COLUMNS =
  "id, category_id, slug, name, description, price_paise, mrp_paise, stock, images, is_active, is_featured, created_at, updated_at";

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, image_url, sort_order")
    .order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data as Category[];
});

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("name");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return data as Product[];
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return data as Product[];
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data as Product | null;
});

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_products", { q });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data as Product[];
}
