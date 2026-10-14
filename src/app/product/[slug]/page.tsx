import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getProductBySlug } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { formatINR } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/pricing";
import { AddToCart } from "@/components/product/AddToCart";
import { Price } from "@/components/product/Price";
import { ProductGallery } from "@/components/product/ProductGallery";
import { StockBadge } from "@/components/product/StockBadge";
import { Container, NotConfigured } from "@/components/ui";
import { ShieldIcon, TruckIcon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  if (!isSupabaseConfigured) return {};
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.split("\n")[0].slice(0, 160),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  if (!isSupabaseConfigured) {
    return (
      <Container className="py-10">
        <NotConfigured />
      </Container>
    );
  }

  const { slug } = await params;
  const [product, categories] = await Promise.all([getProductBySlug(slug), getCategories()]);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.category_id);

  return (
    <Container className="py-6 sm:py-10">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-red-600">
          Home
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/category/${category.slug}`} className="hover:text-red-600">
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
          <div className="mt-4">
            <Price pricePaise={product.price_paise} mrpPaise={product.mrp_paise} size="lg" />
            <p className="mt-1 text-xs text-gray-500">Inclusive of all taxes</p>
          </div>
          <div className="mt-4">
            <StockBadge stock={product.stock} />
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <AddToCart product={{ id: product.id, stock: product.stock }} />
          </div>

          <ul className="mt-6 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-red-600" />
              Free shipping on orders above {formatINR(FREE_SHIPPING_THRESHOLD_PAISE)}
            </li>
            <li className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-red-600" />
              Secure payment with UPI, cards and netbanking
            </li>
          </ul>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-base font-semibold text-gray-900">Product details</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">{product.description}</div>
          </div>
        </div>
      </div>
    </Container>
  );
}
