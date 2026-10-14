import Link from "next/link";
import type { ReactNode } from "react";

// Small shared UI primitives (server-safe: no hooks).

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-red-600 text-white hover:bg-red-700",
    secondary: "border border-gray-300 bg-white text-gray-900 hover:border-red-600 hover:text-red-600",
    ghost: "text-gray-700 hover:bg-gray-100",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  };
  return `${base} ${variants[variant]} ${extra}`;
}

export const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:bg-gray-50";

export const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{children}</h1>
      {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
    </div>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-gray-200 bg-gray-50 text-gray-700",
  };
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${styles[kind]}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={buttonClass("primary", "mt-6")}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Shown when .env.local has not been filled in yet. */
export function NotConfigured() {
  return (
    <Alert kind="info">
      <strong>Store not configured yet.</strong> Add your Supabase keys to <code>.env.local</code> and run
      the SQL files in <code>supabase/</code>. See <code>SETUP.md</code> for step-by-step instructions.
    </Alert>
  );
}
