"use client";

export function QuantitySelector({
  value,
  max,
  onChange,
  disabled = false,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const btn = `flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent ${
    size === "sm" ? "h-8 w-8 text-base" : "h-11 w-11 text-lg"
  }`;
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300">
      <button
        type="button"
        className={`${btn} rounded-l-lg`}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`min-w-10 text-center font-semibold text-gray-900 ${size === "sm" ? "text-sm" : "text-base"}`}
        aria-live="polite"
        aria-label={`Quantity ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        className={`${btn} rounded-r-lg`}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
