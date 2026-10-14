"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { useSignOut } from "./useSignOut";

type NavItem = { href: string; label: string };

export function MobileMenu({ nav, isLoggedIn, isAdmin }: { nav: NavItem[]; isLoggedIn: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const { signOut, signingOut } = useSignOut();
  // Remember which page the menu was opened on, so it closes automatically on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass = "block rounded-lg px-3 py-3 text-base font-medium text-gray-800 hover:bg-red-50 hover:text-red-600";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 rounded-full p-2 text-gray-700 hover:bg-gray-100"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <span className="font-bold text-gray-900">
                Essential<span className="text-red-600">Products</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Shop</p>
              <Link href="/" className={linkClass}>
                Home
              </Link>
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}
              <Link href="/search" className={linkClass}>
                Search
              </Link>

              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Account</p>
              {isLoggedIn ? (
                <>
                  <Link href="/account" className={linkClass}>
                    My account
                  </Link>
                  <Link href="/account/orders" className={linkClass}>
                    My orders
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className={linkClass}>
                      Admin panel
                    </Link>
                  )}
                  <button type="button" onClick={signOut} disabled={signingOut} className={`${linkClass} w-full text-left`}>
                    {signingOut ? "Logging out…" : "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={linkClass}>
                    Login
                  </Link>
                  <Link href="/signup" className={linkClass}>
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
