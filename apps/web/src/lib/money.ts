/**
 * Money helpers. All amounts are stored as INTEGER minor units (cents).
 * The UI accepts/edits major units (e.g. "12.34") and converts to/from cents.
 */

/** Convert a major-unit string (e.g. "12.34") to integer cents (1234). */
export function majorToCents(major: string): number {
  return Math.round(Number.parseFloat(major) * 100);
}

/** Convert integer cents (1234) to a major-unit string ("12.34"). */
export function centsToMajor(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Format integer cents for display with a sign prefix based on type. */
export function formatAmount(cents: number, type: "income" | "expense"): string {
  const sign = type === "income" ? "+" : "-";
  return `${sign}¥${centsToMajor(cents)}`;
}

/** Format integer cents as a plain ¥ amount (no sign) for summaries. */
export function formatTotal(cents: number): string {
  return `¥${centsToMajor(cents)}`;
}
