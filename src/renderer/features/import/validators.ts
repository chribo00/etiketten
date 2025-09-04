export function normalizeString(v: unknown): string {
  return String(v ?? '').trim();
}

export function normalizePrice(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}
