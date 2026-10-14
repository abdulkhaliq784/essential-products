import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay signature checks (pure functions, no secrets read here, easy to test).
// Docs: https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#verify-payment-signature

function safeEqual(expectedHex: string, receivedHex: string): boolean {
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(receivedHex, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout success: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function isValidPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !signature || !keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhooks: HMAC_SHA256(raw request body, webhook_secret), sent in the X-Razorpay-Signature header. */
export function isValidWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  if (!rawBody || !signature || !webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
