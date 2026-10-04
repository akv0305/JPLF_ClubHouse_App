/** Format a rupee amount using en-IN grouping, with no decimals when whole. */
export function formatINR(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "₹0";
  const whole = Math.abs(n - Math.round(n)) < 1e-9;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(n);
}

/** Parse user input into a positive amount, or null when invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s₹]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}
