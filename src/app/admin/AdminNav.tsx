"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-lg bg-gray-100 p-1" aria-label="Admin">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active ? "bg-white text-red-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
