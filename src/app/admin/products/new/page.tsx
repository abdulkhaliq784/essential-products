import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div>
      <Link href="/admin/products" className="text-sm font-semibold text-red-600 hover:underline">
        ← All products
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-gray-900">Add product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
