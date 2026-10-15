import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";
import { calculateTotals, MAX_QTY_PER_ITEM } from "@/lib/pricing";
import { checkPaymentConfig, jsonError as fail, withJsonErrors } from "@/lib/server-config";
import type { Address, ShippingAddress } from "@/lib/types";

const bodySchema = z.object({ addressId: z.uuid() });

/**
 * POST /api/checkout/create-order  { addressId }
 *
 * 1. Reads the logged-in user's cart FROM THE DATABASE (never from the browser).
 * 2. Loads current prices and stock from the products table and validates them.
 * 3. Calculates subtotal, shipping and total on the server.
 * 4. Creates a "pending" order + order items, then a Razorpay order for the total (in paise).
 * Returns only what Razorpay Checkout needs in the browser; no secrets.
 */
export const POST = withJsonErrors(async (request: NextRequest) => {
  const configError = checkPaymentConfig();
  if (configError) return configError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Please log in to place an order.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Please choose a delivery address.");

  // Address: RLS guarantees it belongs to this user.
  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", parsed.data.addressId)
    .maybeSingle<Address>();
  if (!address) return fail(400, "Delivery address not found. Please choose another address.");

  // Cart (RLS: own rows only)
  const { data: cart, error: cartError } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", user.id);
  if (cartError) return fail(500, "Could not read your cart. Please try again.");
  if (!cart || cart.length === 0) return fail(400, "Your cart is empty.");

  const admin = createAdminClient();

  // Current prices and stock straight from the database.
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, price_paise, stock, is_active, images")
    .in(
      "id",
      cart.map((c) => c.product_id),
    );
  if (productsError || !products) return fail(500, "Could not load products. Please try again.");

  const problems: string[] = [];
  const lines = cart.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product || !product.is_active) problems.push("An item in your cart is no longer available.");
    else if (product.stock < item.quantity)
      problems.push(
        product.stock <= 0 ? `${product.name} is out of stock.` : `Only ${product.stock} of ${product.name} left in stock.`,
      );
    else if (item.quantity > MAX_QTY_PER_ITEM) problems.push(`You can buy up to ${MAX_QTY_PER_ITEM} of ${product.name}.`);
    return { product: product!, quantity: item.quantity };
  });
  if (problems.length > 0) {
    return fail(409, `${problems.join(" ")} Please update your cart and try again.`);
  }

  const totals = calculateTotals(lines.map((l) => ({ unitPricePaise: l.product.price_paise, quantity: l.quantity })));

  const shippingAddress: ShippingAddress = {
    full_name: address.full_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };

  // Abandon this user's earlier unpaid attempts so order history stays clean.
  // (If a late payment for one of them still arrives, mark_order_paid will mark it paid.)
  await admin.from("orders").update({ status: "cancelled" }).eq("user_id", user.id).eq("status", "pending");

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      subtotal_paise: totals.subtotal,
      shipping_paise: totals.shipping,
      total_paise: totals.total,
      shipping_address: shippingAddress,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) return fail(500, "Could not create your order. Please try again.");

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      product_name: l.product.name,
      product_image: l.product.images?.[0] ?? null,
      unit_price_paise: l.product.price_paise,
      quantity: l.quantity,
      line_total_paise: l.product.price_paise * l.quantity,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail(500, "Could not create your order. Please try again.");
  }

  let razorpayOrderId: string;
  try {
    const rzpOrder = await getRazorpay().orders.create({
      amount: totals.total, // paise
      currency: "INR",
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });
    razorpayOrderId = rzpOrder.id;
  } catch (e) {
    console.error("Razorpay order creation failed", e);
    await admin.from("orders").delete().eq("id", order.id);
    return fail(502, "Payment service is unavailable right now. Please try again in a moment.");
  }

  await admin.from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("id", order.id);

  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    razorpayOrderId,
    amount: totals.total,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    prefill: {
      name: profile?.full_name ?? address.full_name,
      email: user.email ?? "",
      contact: `+91${address.phone}`,
    },
  });
});
