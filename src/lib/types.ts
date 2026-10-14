// Row types mirroring supabase/001_schema.sql. Money fields are integer paise.

export type UserRole = "customer" | "admin";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  price_paise: number;
  mrp_paise: number | null;
  stock: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

/** Address snapshot stored on orders.shipping_address */
export type ShippingAddress = Omit<Address, "id" | "user_id" | "is_default">;

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  shipping_address: ShippingAddress;
  razorpay_order_id: string | null;
  stock_short: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
}

export interface Payment {
  id: string;
  order_id: string;
  razorpay_payment_id: string;
  amount_paise: number;
  status: string;
  method: string | null;
  created_at: string;
}

/** A cart line as the UI sees it: product details are always loaded fresh from the database. */
export interface CartLine {
  product: Pick<Product, "id" | "slug" | "name" | "price_paise" | "mrp_paise" | "stock" | "images" | "is_active">;
  quantity: number;
}
