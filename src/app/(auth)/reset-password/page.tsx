import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Alert } from "@/components/ui";
import { AuthCard } from "../AuthCard";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  // The email link (via /auth/callback) logs the user in before they land here.
  const user = await getCurrentUser();

  return (
    <AuthCard title="Set a new password">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Alert>
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new one
          </Link>
          .
        </Alert>
      )}
    </AuthCard>
  );
}
