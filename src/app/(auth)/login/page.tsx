import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { Alert } from "@/components/ui";
import { AuthCard } from "../AuthCard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthCard
      title="Welcome back"
      subtitle={
        <>
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-red-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {params.error === "link-expired" && (
        <div className="mb-4">
          <Alert>That link is invalid or has expired. Please try again.</Alert>
        </div>
      )}
      {params.reset === "success" && (
        <div className="mb-4">
          <Alert kind="success">Your password has been updated. Please log in.</Alert>
        </div>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
