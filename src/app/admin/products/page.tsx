import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product/ProductImage";
import { buttonClass, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Products" };

type Row = Product & { category: { name: string } | null };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories (name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const products = data as Row[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link href="/admin/products/new" className={buttonClass("primary")}>
          + Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products yet" actionHref="/admin/products/new" actionLabel="Add your first product" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <div className="w-10 shrink-0">
                        <ProductImage src={p.images[0]} alt="" sizes="40px" className="rounded-md" />
                      </div>
                      <span className="font-medium text-gray-900 hover:text-red-600">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(p.price_paise)}</td>
                  <td className={`px-4 py-3 text-right ${p.stock === 0 ? "font-semibold text-red-600" : ""}`}>{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                    {p.is_featured && (
                      <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Featured</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
