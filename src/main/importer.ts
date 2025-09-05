import Database from 'better-sqlite3';

type Mapping = {
  articleNumber: string; // Spaltenname aus der Datei (Pflicht)
  ean?: string;
  name?: string;
  price?: string;
  unit?: string;
  productGroup?: string;
  category_id?: string; // optional: Zahl oder leer
};

type ImportRow = Record<string, any>;

export async function runImport({
  rows,
  mapping,
  db,
}: {
  rows: ImportRow[];
  mapping: Mapping;
  db: Database;
}) {
  const result = { ok: 0, inserted: 0, updated: 0, skipped: 0, errors: 0, errorRows: [] as any[] };

  // Safety: Artikelnummer muss gemappt sein
  if (!mapping.articleNumber) {
    return { ...result, errors: rows.length, errorRows: rows.map((_, i) => ({ row: i, message: 'Kein Feld für Artikelnummer zugeordnet' })) };
  }

  const tx = db.transaction((batch: ImportRow[]) => {
    for (let i = 0; i < batch.length; i++) {
      const src = batch[i];

      // Werte aus der Datei anhand mapping herausziehen
      // Trim & Normalisieren
      const v = (key?: string) => (key ? String(src[key] ?? '').trim() : undefined);

      const val = {
        articleNumber: v(mapping.articleNumber) || undefined,
        ean: v(mapping.ean),
        name: v(mapping.name),
        price: mapping.price ? toNumber(src[mapping.price]) : undefined,
        unit: v(mapping.unit),
        productGroup: v(mapping.productGroup),
        category_id: mapping.category_id ? toInt(src[mapping.category_id]) : undefined,
      };

      if (!val.articleNumber) {
        result.errors++;
        result.errorRows.push({ row: i, message: 'Leere Artikelnummer' });
        continue;
      }

      // Dynamische Spaltenliste: nur gesetzte Werte berücksichtigen
      const cols: string[] = ['articleNumber'];      // key ist immer dabei
      const params: Record<string, any> = { articleNumber: val.articleNumber };

      ([
        ['ean', val.ean],
        ['name', val.name],
        ['price', val.price],
        ['unit', val.unit],
        ['productGroup', val.productGroup],
        ['category_id', val.category_id],
      ] as const).forEach(([k, vv]) => {
        if (vv !== undefined && vv !== '') {
          cols.push(k);
          params[k] = vv;
        }
      });

      // Falls nur die Artikelnummer da ist, importiere trotzdem (touch), damit updated_at gesetzt wird
      cols.push('updated_at');
      const usingCols = cols.filter(c => c !== 'updated_at'); // für UPSERT-SET

      const insertPlaceholders = cols.map(c => (c === 'updated_at' ? 'CURRENT_TIMESTAMP' : `@${c}`)).join(',');

      // UPSERT mit COALESCE: Nur gesetzte Felder überschreiben, sonst alten Wert behalten
      const setClauses = usingCols
        .filter(c => c !== 'articleNumber') // key nie updaten
        .map(c => `${c}=COALESCE(excluded.${c}, ${'articles.' + c})`)
        .concat(`updated_at=CURRENT_TIMESTAMP`)
        .join(', ');

      const upsertSql =
        `INSERT INTO articles (${cols.join(',')}) ` +
        `VALUES (${insertPlaceholders}) ` +
        `ON CONFLICT(articleNumber) DO UPDATE SET ${setClauses}`;

      try {
        // 1) Primärweg: UPSERT
        const stmt = db.prepare(upsertSql);
        const info = stmt.run(params);

        // Heuristik inserted/updated
        if (info.changes === 1 && info.lastInsertRowid) {
          result.inserted++;
        } else {
          result.updated++;
        }
        result.ok++;
      } catch (e: any) {
        // 2) Fallback: UPDATE → wenn 0 rows → INSERT
        try {
          // UPDATE nur für gesetzte Felder
          const updateCols = usingCols.filter(c => c !== 'articleNumber');
          if (updateCols.length > 0) {
            const updSql =
              `UPDATE articles SET ` +
              updateCols.map(c => `${c}=@${c}`).concat('updated_at=CURRENT_TIMESTAMP').join(', ') +
              ` WHERE articleNumber=@articleNumber`;
            const upd = db.prepare(updSql).run(params);
            if (upd.changes > 0) {
              result.updated++;
              result.ok++;
              continue;
            }
          }

          // INSERT (nur gesetzte Spalten + updated_at)
          const insCols = usingCols.concat('updated_at');
          const insVals = insCols.map(c => (c === 'updated_at' ? 'CURRENT_TIMESTAMP' : `@${c}`)).join(',');
          const insSql = `INSERT INTO articles (${insCols.join(',')}) VALUES (${insVals})`;
          db.prepare(insSql).run(params);
          result.inserted++;
          result.ok++;
        } catch (e2: any) {
          result.errors++;
          result.errorRows.push({
            row: i,
            columnsPresent: Object.keys(params),
            valuesPresent: params,
            sqlTried: upsertSql,
            message: String(e2?.message || e2),
          });
        }
      }
    }
  });

  try {
    tx(rows);
  } catch (e: any) {
    // Sollte durch obige catchs selten kommen
    return { ...result, fatal: String(e?.message || e) };
  }

  return result;
}

function toNumber(x: any): number | undefined {
  if (x === null || x === undefined || x === '') return undefined;
  const s = String(x).replace(/\./g, '').replace(',', '.').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
function toInt(x: any): number | undefined {
  const n = Number.parseInt(String(x).trim(), 10);
  return Number.isFinite(n) ? n : undefined;
}
