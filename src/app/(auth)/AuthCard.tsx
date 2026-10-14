import type { ReactNode } from "react";
import { Container } from "@/components/ui";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </Container>
  );
}
