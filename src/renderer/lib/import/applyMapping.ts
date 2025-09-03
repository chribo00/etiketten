export type Mapping = Record<string, string>;

const normalizePrice = (v: any): number | null => {
  if (v == null) return null;
  const s = String(v).replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
};

const isValidEan = (ean: string): boolean => /^(\d{8}|\d{12,13})$/.test(ean);

export function applyMapping({ rows, headers, mapping }: { rows: any[]; headers: string[]; mapping: Mapping }) {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => (idx[h] = i));
  return rows
    .map((r) => {
      const get = (field: string) => r[idx[mapping[field]] ?? -1];
      const articleNumber = String(get('artikelnummer') ?? '').trim();
      if (!articleNumber) return null;

      const eanRaw = String(get('ean') ?? '').trim();
      const ean = isValidEan(eanRaw) ? eanRaw : null;

      const name = String(get('kurztext') ?? '').trim();
      const price = normalizePrice(get('preis')) ?? 0;
      const unit = String(get('einheit') ?? '').trim();

      return {
        articleNumber,
        ean,
        name: name || '(ohne Bezeichnung)',
        price,
        unit: unit || null,
      };
    })
    .filter(Boolean);
}

