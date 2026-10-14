import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { Alert } from "@/components/ui";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: product, error }, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle<Product>(),
    getCategories(),
  ]);
  if (error) throw new Error(error.message);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-sm font-semibold text-red-600 hover:underline">
        ← All products
      </Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
        {product.is_active && (
          <Link href={`/product/${product.slug}`} className="text-sm text-gray-600 hover:text-red-600">
            View in shop ↗
          </Link>
        )}
      </div>
      {query.created && (
        <div className="mb-6">
          <Alert kind="success">Product created.</Alert>
        </div>
      )}
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
