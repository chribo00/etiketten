import { ArticleRecord, PriceRecord } from './records';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateArticle(rec: ArticleRecord, version: 'v4' | 'v5'): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxEAN = version === 'v4' ? 13 : 18;
  if (!rec.artnr) errors.push({ field: 'artnr', message: 'required' });
  if (rec.artnr) {
    if (rec.artnr.trim().length > 15) errors.push({ field: 'artnr', message: `max 15` });
    if (!/^[A-Za-z0-9_-]+$/.test(rec.artnr.trim()))
      errors.push({ field: 'artnr', message: 'invalid' });
  }
  if (!rec.kurztext1) errors.push({ field: 'kurztext1', message: 'required' });
  if (rec.kurztext1 && rec.kurztext1.length > 40)
    errors.push({ field: 'kurztext1', message: 'max 40' });
  if (rec.kurztext2 && rec.kurztext2.length > 40)
    errors.push({ field: 'kurztext2', message: 'max 40' });
  if (rec.einheit && rec.einheit.length > 4)
    errors.push({ field: 'einheit', message: 'max 4' });
  if (rec.ean && rec.ean.length > maxEAN)
    errors.push({ field: 'ean', message: `max ${maxEAN}` });
  if (rec.matchcode && rec.matchcode.length > 15)
    errors.push({ field: 'matchcode', message: 'max 15' });
  return errors;
}

export function validatePrice(rec: PriceRecord, version: 'v4' | 'v5'): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!['1', '2'].includes(rec.kennzeichen))
    errors.push({ field: 'kennzeichen', message: 'invalid' });
  if (rec.einheit && rec.einheit.length > (version === 'v4' ? 4 : 6))
    errors.push({ field: 'einheit', message: `max ${version === 'v4' ? 4 : 6}` });
  return errors;
}
