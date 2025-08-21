import { AnyRecord } from '../records';

export function parseV5Line(line: string): AnyRecord | null {
  const cols = line
    .split(';')
    .map((c) => c.replace(/^"|"$/g, ''))
    .map((c) => c.trim());
  const type = cols[0];
  switch (type) {
    case 'V':
      return { type: 'V', creator: cols[1], currency: cols[2], date: cols[3] } as AnyRecord;
    case 'S':
      return { type: 'S', hauptgruppe: cols[1], gruppe: cols[2], bezeichnung: cols[3] };
    case 'R':
      return { type: 'R', nummer: cols[1], bezeichnung: cols[2] };
    case 'A':
      return {
        type: 'A',
        artnr: cols[1],
        kurztext1: cols[2],
        kurztext2: cols[3],
        einheit: cols[4],
        ean: cols[5],
        matchcode: cols[6],
        warengruppe: cols[7],
        rabattgruppe: cols[8],
      };
    case 'B':
      return { type: 'B', artnr: cols[1], katalogseite: cols[2], steuer_merker: cols[3] };
    case 'T':
      return { type: 'T', artnr: cols[1], text: cols[2] };
    case 'P':
      return {
        type: 'P',
        artnr: cols[1],
        kennzeichen: cols[2] as '1' | '2',
        betrag: cols[3],
        einheit: cols[4],
        gueltig_ab: cols[5],
        gueltig_bis: cols[6],
        kundennr: cols[7],
      };
    case 'Z':
      return { type: 'Z', artnr: cols[1], von_menge: cols[2], aufabschlag: cols[3] };
    case 'G':
      return { type: 'G', artnr: cols[1], art: cols[2], dateiname: cols[3], beschreibung: cols[4] };
    case 'J':
      return { type: 'J', parent: cols[1], child: cols[2], menge: cols[3] };
    case 'E':
      return { type: 'E' } as AnyRecord;
    default:
      return null;
  }
}
