import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidWebhookSignature } from "@/lib/razorpay-signature";

/**
 * POST /api/webhooks/razorpay
 * Backup path for payment status, in case the customer closes the browser
 * before /api/checkout/verify runs. Configure in Razorpay Dashboard → Webhooks with
 * events: payment.captured, payment.failed (order.paid is handled too).
 *
 * The signature is computed over the RAW body, so we read it with request.text()
 * before parsing. Invalid signatures are rejected with 400.
 */

type PaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  method?: string;
};

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!isValidWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: PaymentEntity } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return NextResponse.json({ ok: true, ignored: true });

  const admin = createAdminClient();

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const { error } = await admin.rpc("mark_order_paid", {
      p_razorpay_order_id: payment.order_id,
      p_razorpay_payment_id: payment.id,
      p_amount_paise: payment.amount,
      p_payment_status: payment.status,
      p_method: payment.method ?? null,
      p_raw: payment,
    });
    if (error) {
      // Not one of our orders (e.g. a payment from another integration): acknowledge and ignore.
      if (error.message.includes("Order not found")) return NextResponse.json({ ok: true, ignored: true });
      console.error("Webhook mark_order_paid failed", error);
      // 500 makes Razorpay retry later.
      return NextResponse.json({ error: "Could not update order" }, { status: 500 });
    }
  } else if (event.event === "payment.failed") {
    const { error } = await admin
      .from("orders")
      .update({ status: "payment_failed" })
      .eq("razorpay_order_id", payment.order_id)
      .eq("status", "pending");
    if (error) {
      console.error("Webhook payment.failed update failed", error);
      return NextResponse.json({ error: "Could not update order" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
