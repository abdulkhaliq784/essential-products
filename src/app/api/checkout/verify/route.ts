import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay, getRazorpayKeySecret } from "@/lib/razorpay";
import { isValidPaymentSignature } from "@/lib/razorpay-signature";
import { checkPaymentConfig, jsonError as fail, withJsonErrors } from "@/lib/server-config";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * POST /api/checkout/verify
 * Called by the browser after Razorpay Checkout reports success.
 *  1. Verifies the payment signature with our key secret (proves the response came from Razorpay).
 *  2. Fetches the payment from Razorpay and checks order id, amount and status.
 *  3. Marks the order paid and reduces stock (atomically, in mark_order_paid).
 * The webhook does the same independently, in case the browser never calls this.
 */
export const POST = withJsonErrors(async (request: NextRequest) => {
  const configError = checkPaymentConfig();
  if (configError) return configError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Please log in.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid payment details.");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!isValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, getRazorpayKeySecret())) {
    return fail(400, "Payment verification failed. If money was deducted, it will be refunded automatically.");
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, total_paise")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();
  if (!order || order.user_id !== user.id) return fail(404, "Order not found.");

  try {
    const razorpay = getRazorpay();
    let payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id || Number(payment.amount) !== order.total_paise) {
      return fail(400, "Payment details do not match this order.");
    }
    // If auto-capture is turned off in the Razorpay dashboard, capture it now.
    if (payment.status === "authorized") {
      payment = await razorpay.payments.capture(razorpay_payment_id, order.total_paise, "INR");
    }
    if (payment.status !== "captured") {
      return fail(402, "Payment was not completed. Please try again.");
    }

    const { error } = await admin.rpc("mark_order_paid", {
      p_razorpay_order_id: razorpay_order_id,
      p_razorpay_payment_id: razorpay_payment_id,
      p_amount_paise: Number(payment.amount),
      p_payment_status: payment.status,
      p_method: payment.method ?? null,
      p_raw: payment,
    });
    if (error) throw error;
  } catch (e) {
    console.error("Payment verification error", e);
    return fail(
      500,
      "We received your payment but couldn't confirm the order yet. Please check My Orders in a minute. Don't pay again.",
    );
  }

  return NextResponse.json({ orderId: order.id });
});
