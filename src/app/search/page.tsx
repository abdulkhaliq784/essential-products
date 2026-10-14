import type { Metadata } from "next";
import { searchProducts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { ProductGrid } from "@/components/product/ProductCard";
import { buttonClass, Container, EmptyState, NotConfigured, PageTitle } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const results = isSupabaseConfigured && query ? await searchProducts(query) : [];

  return (
    <Container className="py-8 sm:py-10">
      <PageTitle>{query ? <>Results for &ldquo;{query}&rdquo;</> : "Search products"}</PageTitle>

      <form action="/search" role="search" className="mb-8 flex max-w-xl gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="e.g. microfiber, mustard oil, garbage bags"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            autoFocus={!query}
          />
        </label>
        <button type="submit" className={buttonClass("primary")}>
          Search
        </button>
      </form>

      {!isSupabaseConfigured ? (
        <NotConfigured />
      ) : !query ? (
        <p className="text-gray-600">Type a product name or keyword above to search our store.</p>
      ) : results.length > 0 ? (
        <>
          <p className="mb-6 text-sm text-gray-600">
            {results.length} {results.length === 1 ? "product" : "products"} found
          </p>
          <ProductGrid products={results} />
        </>
      ) : (
        <EmptyState
          title="No products found"
          description={`We couldn't find anything matching "${query}". Try a different or shorter word.`}
          actionHref="/"
          actionLabel="Browse categories"
        />
      )}
    </Container>
  );
}
