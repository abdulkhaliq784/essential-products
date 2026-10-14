import Link from "next/link";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";
import { LOW_STOCK_THRESHOLD } from "./StockBadge";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const outOfStock = product.stock <= 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, 50vw"
          className={`transition group-hover:opacity-90 ${outOfStock ? "opacity-60" : ""}`}
        />
        {outOfStock ? (
          <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-semibold text-white">
            Out of stock
          </span>
        ) : product.stock <= LOW_STOCK_THRESHOLD ? (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            Only {product.stock} left
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-red-600 sm:text-base">
        {product.name}
      </h3>
      <div className="mt-1">
        <Price pricePaise={product.price_paise} mrpPaise={product.mrp_paise} />
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 2} />
      ))}
    </div>
  );
}
