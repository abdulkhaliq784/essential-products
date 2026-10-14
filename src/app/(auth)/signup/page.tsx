import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { AuthCard } from "../AuthCard";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthCard
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-red-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthCard>
  );
}
