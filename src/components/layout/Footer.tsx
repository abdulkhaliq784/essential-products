import Link from "next/link";
import { Container } from "@/components/ui";

export function Footer() {
  const year = new Date().getFullYear();
  const linkClass = "text-sm text-gray-600 hover:text-red-600";

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-lg font-bold text-gray-900">
            Essential<span className="text-red-600">Products</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-gray-600">
            Everyday household essentials delivered to your door across India.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Shop</h2>
          <ul className="mt-3 space-y-2">
            <li><Link href="/category/cleaning-towels" className={linkClass}>Cleaning Towels</Link></li>
            <li><Link href="/category/garbage-bags" className={linkClass}>Garbage Bags</Link></li>
            <li><Link href="/category/oil-bottles" className={linkClass}>Oil Bottles</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          <ul className="mt-3 space-y-2">
            <li><Link href="/account" className={linkClass}>My account</Link></li>
            <li><Link href="/account/orders" className={linkClass}>My orders</Link></li>
            <li><Link href="/cart" className={linkClass}>Cart</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Help</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>Free shipping on orders above ₹499</li>
            <li>Secure payments by Razorpay</li>
            <li>
              <a href="mailto:support@essentialproducts.in" className={linkClass}>
                support@essentialproducts.in
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-gray-200">
        <Container className="py-4 text-center text-xs text-gray-500">
          © {year} Essential Products. All prices in INR and inclusive of GST.
        </Container>
      </div>
    </footer>
  );
}
