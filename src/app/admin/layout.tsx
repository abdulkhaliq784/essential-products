import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/ui";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin | Essential Products" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Non-admins are redirected away. RLS in the database enforces the same rule
  // for every read and write, so this is a second, independent check.
  await requireAdmin();

  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Admin panel</p>
        <AdminNav />
      </div>
      {children}
    </Container>
  );
}
