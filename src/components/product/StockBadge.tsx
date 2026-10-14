export const LOW_STOCK_THRESHOLD = 5;

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
        Out of stock
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
      In stock
    </span>
  );
}
