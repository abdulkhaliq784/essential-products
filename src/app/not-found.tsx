import Link from "next/link";
import { buttonClass, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="text-sm font-semibold text-red-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-gray-600">
        The page or product you&apos;re looking for doesn&apos;t exist or is no longer available.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className={buttonClass("primary")}>
          Continue shopping
        </Link>
        <Link href="/search" className={buttonClass("secondary")}>
          Search products
        </Link>
      </div>
    </Container>
  );
}
