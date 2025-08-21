export interface HeaderRecord {
  type: 'V';
  creator?: string;
  currency?: string;
  date?: string;
}

export interface WarengruppeRecord {
  type: 'S';
  hauptgruppe: string;
  gruppe: string;
  bezeichnung: string;
}

export interface RabattgruppeRecord {
  type: 'R';
  nummer: string;
  bezeichnung: string;
}

export interface ArticleRecord {
  type: 'A';
  artnr: string;
  kurztext1: string;
  kurztext2?: string;
  einheit: string;
  ean?: string;
  matchcode?: string;
  warengruppe?: string;
  rabattgruppe?: string;
}

export interface ArticleAddRecord {
  type: 'B';
  artnr: string;
  katalogseite?: string;
  steuer_merker?: string;
}

export interface TextRecord {
  type: 'T';
  artnr: string;
  text: string;
}

export interface PriceRecord {
  type: 'P';
  artnr: string;
  kennzeichen: '1'|'2';
  betrag: string; // decimal as string
  einheit: string;
  gueltig_ab?: string;
  gueltig_bis?: string;
  kundennr?: string;
}

export interface PriceTierRecord {
  type: 'Z';
  artnr: string;
  von_menge: string;
  aufabschlag: string; // decimal string
}

export interface MediaRecord {
  type: 'G';
  artnr: string;
  art: string;
  dateiname: string;
  beschreibung?: string;
}

export interface SetRecord {
  type: 'J';
  parent: string;
  child: string;
  menge: string;
}

export type AnyRecord =
  | HeaderRecord
  | WarengruppeRecord
  | RabattgruppeRecord
  | ArticleRecord
  | ArticleAddRecord
  | TextRecord
  | PriceRecord
  | PriceTierRecord
  | MediaRecord
  | SetRecord;
