import { AnyRecord } from '../records';

function slice(line: string, start: number, length: number): string {
  return line.substring(start - 1, start - 1 + length).trim();
}

export function parseV4Line(line: string): AnyRecord | null {
  const type = line[0];
  switch (type) {
    case 'V':
      return { type: 'V' } as AnyRecord;
    case 'S':
      return {
        type: 'S',
        hauptgruppe: slice(line, 2, 3),
        gruppe: slice(line, 5, 10),
        bezeichnung: slice(line, 15, 40),
      };
    case 'R':
      return { type: 'R', nummer: slice(line, 2, 4), bezeichnung: slice(line, 6, 40) };
    case 'A':
      return {
        type: 'A',
        artnr: slice(line, 2, 15),
        kurztext1: slice(line, 17, 40),
        kurztext2: slice(line, 57, 40),
        einheit: slice(line, 97, 4),
        ean: slice(line, 101, 13),
        matchcode: slice(line, 114, 15),
        warengruppe: slice(line, 129, 10),
        rabattgruppe: slice(line, 139, 4),
      };
    case 'B':
      return {
        type: 'B',
        artnr: slice(line, 2, 15),
        katalogseite: slice(line, 17, 5),
        steuer_merker: slice(line, 22, 1),
      };
    case 'T':
      return { type: 'T', artnr: slice(line, 2, 15), text: slice(line, 17, 40) };
    case 'P':
      return {
        type: 'P',
        artnr: slice(line, 2, 15),
        kennzeichen: slice(line, 17, 1) as '1' | '2',
        betrag: slice(line, 18, 8),
        einheit: slice(line, 26, 4),
        gueltig_ab: slice(line, 30, 8),
        gueltig_bis: slice(line, 38, 8),
      };
    case 'Z':
      return {
        type: 'Z',
        artnr: slice(line, 2, 15),
        von_menge: slice(line, 17, 5),
        aufabschlag: slice(line, 22, 6),
      };
    case 'E':
      return { type: 'E' } as AnyRecord;
    default:
      return null;
  }
}
