export type Mapping = Record<string, string>;

const normalizePrice = (v: any): number | null => {
  if (v == null) return null;
  const s = String(v).replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
};

const isValidEan = (ean: string): boolean => /^(\d{8}|\d{12,13})$/.test(ean);

export function applyMapping({
  rows,
  headers,
  mapping,
}: {
  rows: any[];
  headers: string[];
  mapping: Mapping;
}) {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => (idx[h] = i));
  const items: any[] = [];
  const errors: { row: number; field: string }[] = [];
  const seenEan = new Set<string>();
  rows.forEach((r, rowIdx) => {
    const get = (field: string) => r[idx[mapping[field]] ?? -1];
    const articleNumber = String(get('artikelnummer') ?? '').trim();
    if (!articleNumber) {
      errors.push({ row: rowIdx, field: 'artikelnummer' });
      return;
    }

    const eanRaw = String(get('ean') ?? '').trim();
    const ean = eanRaw && isValidEan(eanRaw) ? eanRaw : null;
    if (eanRaw && !ean) errors.push({ row: rowIdx, field: 'ean' });
    if (ean && seenEan.has(ean)) errors.push({ row: rowIdx, field: 'ean' });
    if (ean) seenEan.add(ean);

    const name = String(get('kurztext') ?? '').trim();
    const price = normalizePrice(get('preis'));
    if (price == null) errors.push({ row: rowIdx, field: 'preis' });
    const unit = String(get('einheit') ?? '').trim();

    items.push({
      articleNumber,
      ean,
      name: name || '(ohne Bezeichnung)',
      price: price ?? 0,
      unit: unit || null,
    });
  });
  return { items, errors };
}

