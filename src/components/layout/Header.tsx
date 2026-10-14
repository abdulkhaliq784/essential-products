import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { Container } from "@/components/ui";
import { SearchIcon, UserIcon } from "@/components/icons";
import { CartLink } from "./CartLink";
import { MobileMenu } from "./MobileMenu";
import { AccountMenu } from "./AccountMenu";

// Fallback so navigation still renders if the database is unreachable or not set up yet.
const FALLBACK_CATEGORIES = [
  { slug: "cleaning-towels", name: "Cleaning Towels" },
  { slug: "garbage-bags", name: "Garbage Bags" },
  { slug: "oil-bottles", name: "Oil Bottles" },
];

async function loadCategories() {
  if (!isSupabaseConfigured) return FALLBACK_CATEGORIES;
  try {
    const categories = await getCategories();
    return categories.length ? categories : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function Header() {
  const [categories, profile] = await Promise.all([loadCategories(), getCurrentProfile()]);
  const nav = categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }));

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-3">
        <MobileMenu nav={nav} isLoggedIn={Boolean(profile)} isAdmin={profile?.role === "admin"} />

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Essential Products home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
            EP
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Essential<span className="text-red-600">Products</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Categories">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-gray-700 hover:text-red-600">
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/search" className="ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              placeholder="Search products…"
              className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-red-600 focus:bg-white focus:outline-none"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link
            href="/search"
            className="rounded-full p-2 text-gray-700 hover:bg-gray-100 hover:text-red-600 md:hidden"
            aria-label="Search"
          >
            <SearchIcon className="h-6 w-6" />
          </Link>
          {profile ? (
            <AccountMenu name={profile.full_name} isAdmin={profile.role === "admin"} />
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600 sm:flex"
            >
              <UserIcon className="h-5 w-5" />
              Login
            </Link>
          )}
          <CartLink />
        </div>
      </Container>
    </header>
  );
}
