/**
 * Formats money for display: x → x*1000 VND with thousand separators
 * e.g. formatMoney(50) → "50,000 VND"
 */
export function formatMoney(x: number): string {
  const value = x * 1000;
  return `${value.toLocaleString('en-US')} VND`;
}

/**
 * Parses a string to an integer for storage (user input → DB value)
 * e.g. parseMoney("50") → 50
 */
export function parseMoney(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}