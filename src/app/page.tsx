import Image from "next/image";
import Link from "next/link";
import { getCategories, getFeaturedProducts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { ProductGrid } from "@/components/product/ProductCard";
import { buttonClass, Container, EmptyState, NotConfigured } from "@/components/ui";
import { LeafIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export default async function HomePage() {
  const [categories, featured] = isSupabaseConfigured
    ? await Promise.all([getCategories(), getFeaturedProducts(6)])
    : [[], []];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-red-50/60 to-white">
        <Container className="grid items-center gap-8 py-10 sm:py-14 md:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              Free shipping above ₹499
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Everyday essentials, <span className="text-red-600">delivered.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-gray-600 sm:text-lg">
              Quality cleaning towels, strong garbage bags and pure cooking oil at honest prices, right to your
              doorstep.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#categories" className={buttonClass("primary", "px-6 py-3 text-base")}>
                Shop now
              </Link>
              <Link href="/search" className={buttonClass("secondary", "px-6 py-3 text-base")}>
                Search products
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm">
            <Image
              src="/images/cleaning-towels/towel-1.jpg"
              alt="Household cleaning essentials"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-b border-gray-100">
        <Container className="grid grid-cols-1 gap-4 py-6 text-sm sm:grid-cols-3">
          {[
            { icon: TruckIcon, title: "Fast delivery", text: "Across India, free above ₹499" },
            { icon: ShieldIcon, title: "Secure payments", text: "UPI, cards & netbanking via Razorpay" },
            { icon: LeafIcon, title: "Quality assured", text: "Carefully chosen everyday products" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="h-8 w-8 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-gray-600">{text}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <Container className="py-12">
        {!isSupabaseConfigured && (
          <div className="mb-10">
            <NotConfigured />
          </div>
        )}

        {/* Categories */}
        <section id="categories" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Shop by category</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group relative block aspect-[16/10] overflow-hidden rounded-xl bg-gray-100 sm:aspect-[4/5]"
              >
                {c.image_url && (
                  <Image
                    src={c.image_url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg font-bold text-white">{c.name}</h3>
                  <p className="mt-1 text-sm font-medium text-white/90 group-hover:underline">Shop now →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Featured products</h2>
          </div>
          {featured.length > 0 ? (
            <ProductGrid products={featured} />
          ) : (
            isSupabaseConfigured && (
              <EmptyState title="No products yet" description="Products added in the admin panel will appear here." />
            )
          )}
        </section>
      </Container>
    </>
  );
}
