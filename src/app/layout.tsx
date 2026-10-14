import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Essential Products: Household Essentials Online",
    template: "%s | Essential Products",
  },
  description:
    "Shop cleaning towels, garbage bags and cooking oil online. Free shipping above ₹499. Secure payments with Razorpay.",
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en-IN" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <CartProvider initialUserId={user?.id ?? null}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
