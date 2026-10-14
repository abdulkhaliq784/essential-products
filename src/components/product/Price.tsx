import { formatINR } from "@/lib/format";

export function Price({
  pricePaise,
  mrpPaise,
  size = "md",
}: {
  pricePaise: number;
  mrpPaise?: number | null;
  size?: "md" | "lg";
}) {
  const hasDiscount = mrpPaise != null && mrpPaise > pricePaise;
  const off = hasDiscount ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100) : 0;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`font-bold text-gray-900 ${size === "lg" ? "text-3xl" : "text-base"}`}>{formatINR(pricePaise)}</span>
      {hasDiscount && (
        <>
          <span className={`text-gray-400 line-through ${size === "lg" ? "text-base" : "text-xs"}`}>
            <span className="sr-only">MRP </span>
            {formatINR(mrpPaise)}
          </span>
          <span className={`font-semibold text-red-600 ${size === "lg" ? "text-base" : "text-xs"}`}>{off}% off</span>
        </>
      )}
    </div>
  );
}
