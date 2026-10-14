"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { UserIcon } from "@/components/icons";
import { useSignOut } from "./useSignOut";

export function AccountMenu({ name, isAdmin }: { name: string | null; isAdmin: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { signOut, signingOut } = useSignOut();
  // Remember which page the menu was opened on, so it closes automatically on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof value === "function" ? value(open) : value) ? pathname : null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenOn(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600";

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600"
      >
        <UserIcon className="h-5 w-5" />
        <span className="max-w-28 truncate">{name?.split(" ")[0] || "Account"}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <Link href="/account" className={itemClass} role="menuitem">
            My account
          </Link>
          <Link href="/account/orders" className={itemClass} role="menuitem">
            My orders
          </Link>
          {isAdmin && (
            <Link href="/admin" className={itemClass} role="menuitem">
              Admin panel
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className={`${itemClass} w-full border-t border-gray-100 text-left`}
          >
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
