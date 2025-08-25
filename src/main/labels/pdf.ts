import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { app } from 'electron';
import { getArticle } from '../db';

const mm = (v: number) => v * 2.83465;
const PAGE = { w: mm(100), h: mm(50), margin: mm(5) };

function expanded(items: Array<{ articleId: string; qty: number; options: any }>) {
  const out: any[] = [];
  for (const it of items) {
    for (let i = 0; i < (it.qty || 1); i++) {
      out.push({ articleId: it.articleId, options: it.options || {} });
    }
  }
  return out;
}

const eanChecksum12 = (digits12: string): number => {
  const digits = digits12.split('').map((d) => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digits[i] * weight;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
};

async function renderBarcode(artnr: string): Promise<Buffer> {
  const trimmed = artnr.trim();
  let bcid: 'ean13' | 'code128' = 'code128';
  let code = trimmed;
  if (/^\d{13}$/.test(trimmed)) {
    const d12 = trimmed.slice(0, 12);
    const check = eanChecksum12(d12);
    code = `${d12}${check}`;
    bcid = 'ean13';
  }
  const opts = {
    bcid,
    text: code,
    alttext: trimmed,
    scale: 2,
    height: 20,
    includetext: true,
    textxalign: 'center' as const,
    textfont: 'Helvetica',
    textsize: 14,
  };
  try {
    return await bwipjs.toBuffer(opts);
  } catch {
    return await bwipjs.toBuffer({ ...opts, bcid: 'code128' });
  }
}

export async function generateLabelsPdf(items: Array<{ articleId: string; qty: number; options: any }>): Promise<string> {
  const outDir = path.join(app.getPath('userData'), 'labels');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `labels-${Date.now()}.pdf`);
  const doc = new PDFDocument({ size: [PAGE.w, PAGE.h], margin: PAGE.margin });
  doc.pipe(fs.createWriteStream(outPath));

  for (const it of expanded(items)) {
    const art = getArticle(it.articleId);
    if (!art) continue;
    doc.addPage({ size: [PAGE.w, PAGE.h], margin: PAGE.margin });

    let cursorY = mm(2);
    if (it.options.showArticleNumber && art.articleNumber) {
      doc.fontSize(9).text(art.articleNumber, mm(2), cursorY);
      cursorY = doc.y + mm(2);
    }
    if (it.options.showShortText && art.shortText) {
      doc.fontSize(10).text(art.shortText, mm(2), cursorY, { width: mm(45) });
      cursorY = doc.y + mm(2);
    }
    if (it.options.showListPrice && art.listPrice) {
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`${art.listPrice.toFixed(2)} €`, mm(2), cursorY);
      doc.font('Helvetica');
      cursorY = doc.y + mm(3);
    }
    if (it.options.showImage && art.imagePath && fs.existsSync(art.imagePath)) {
      doc.image(art.imagePath, mm(2), cursorY, {
        width: mm(38),
        height: mm(18),
        fit: [mm(38), mm(18)],
      });
      cursorY += mm(18) + mm(3);
    }
    if (it.options.showEan && art.articleNumber) {
      const png = await renderBarcode(art.articleNumber);
      doc.image(png, mm(2), cursorY, { width: mm(48), height: mm(22) });
      cursorY += mm(22);
    }
  }

  doc.end();
  return outPath;
}
