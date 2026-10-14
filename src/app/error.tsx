"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass, Container } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-20 text-center">
      <p className="text-sm font-semibold text-red-600">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">We couldn&apos;t load this page</h1>
      <p className="mx-auto mt-3 max-w-md text-gray-600">
        Please check your internet connection and try again. If the problem continues, try again in a few minutes.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClass("primary")}>
          Try again
        </button>
        <Link href="/" className={buttonClass("secondary")}>
          Go home
        </Link>
      </div>
    </Container>
  );
}
