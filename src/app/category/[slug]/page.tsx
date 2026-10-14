import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container, EmptyState, NotConfigured, PageTitle } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  if (!isSupabaseConfigured) return {};
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return category ? { title: category.name, description: category.description ?? undefined } : {};
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  if (!isSupabaseConfigured) {
    return (
      <Container className="py-10">
        <NotConfigured />
      </Container>
    );
  }

  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const products = await getProductsByCategory(category.id);

  return (
    <Container className="py-8 sm:py-10">
      <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-red-600">
          Home
        </Link>{" "}
        / <span className="text-gray-900">{category.name}</span>
      </nav>
      <PageTitle subtitle={category.description}>{category.name}</PageTitle>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          title="No products in this category yet"
          description="Please check back soon, or browse our other categories."
          actionHref="/"
          actionLabel="Back to home"
        />
      )}
    </Container>
  );
}
