// Shipping rule shared by the cart display and the server-side order calculation.
// The SERVER recomputes everything from database prices; the client copy is display only.

export const FREE_SHIPPING_THRESHOLD_PAISE = 49900; // ₹499
export const SHIPPING_FEE_PAISE = 4900; // ₹49
export const MAX_QTY_PER_ITEM = 10;

export function calculateTotals(lines: { unitPricePaise: number; quantity: number }[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPricePaise * l.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : SHIPPING_FEE_PAISE;
  return { subtotal, shipping, total: subtotal + shipping };
}
