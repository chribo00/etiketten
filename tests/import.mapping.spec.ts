import { applyMapping } from '../src/renderer/lib/import/applyMapping';

const headers = ['Artikelnr', 'Kurztext', 'Listenpreis', 'Mengeneinheit', 'EAN'];
const mapping = {
  artikelnummer: 'Artikelnr',
  kurztext: 'Kurztext',
  preis: 'Listenpreis',
  einheit: 'Mengeneinheit',
  ean: 'EAN',
};

describe('applyMapping', () => {
  test('maps and normalizes fields', () => {
    const rows = [[' degu123 ', 'Test', '12,34', 'kg', '12345678']];
    const { items, errors } = applyMapping({ rows, headers, mapping });
    expect(errors).toHaveLength(0);
    expect(items[0]).toEqual({
      articleNumber: 'degu123',
      ean: '12345678',
      name: 'Test',
      price: 12.34,
      unit: 'kg',
    });
  });

  test('invalid rows yield errors', () => {
    const rows = [['', '', '', '', '']];
    const { items, errors } = applyMapping({ rows, headers, mapping });
    expect(items).toHaveLength(0);
    expect(errors[0].field).toBe('artikelnummer');
  });

  test('duplicate ean flagged', () => {
    const rows = [
      ['a1', 'n1', '1', 'St', '12345678'],
      ['a2', 'n2', '2', 'St', '12345678'],
    ];
    const { errors } = applyMapping({ rows, headers, mapping });
    expect(errors.some((e) => e.field === 'ean')).toBe(true);
  });
});

