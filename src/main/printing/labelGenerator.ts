import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import db from '../database';
import { LabelJob } from '../types';

const LABEL_WIDTH = 283.46; // 10 cm
const LABEL_HEIGHT = 141.73; // 5 cm
const MARGIN = 7;

export async function generateLabels(job: LabelJob): Promise<{ pdfPath: string }> {
  const dir = path.join(app.getPath('userData'), 'labels');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const pdfPath = path.join(dir, `${Date.now()}.pdf`);
  const doc = new PDFDocument({ size: [LABEL_WIDTH, LABEL_HEIGHT], margin: MARGIN });
  doc.pipe(fs.createWriteStream(pdfPath));

  for (const item of job.items) {
    const article = db.prepare('SELECT * FROM articles WHERE id=?').get(item.articleId);
    if (!article) continue;

    if (job.printFields.showShortText && article.shortText) {
      doc.fontSize(12).text(article.shortText, MARGIN, MARGIN, { width: LABEL_WIDTH - MARGIN * 2 });
    }

    if (job.printFields.showEAN) {
      const code = article.ean || article.articleNumber;
      const png = await bwipjs.toBuffer({
        bcid: article.ean ? 'ean13' : 'code128',
        text: code,
        scale: 3,
        height: 20,
        includetext: true,
      });
      doc.image(png, MARGIN, LABEL_HEIGHT - 60, { width: LABEL_WIDTH - MARGIN * 2, height: 50, align: 'center' });
    }

    if (job.printFields.showArticleNumber) {
      doc.fontSize(8).text(article.articleNumber, MARGIN, LABEL_HEIGHT - 10);
    }

    doc.addPage();
  }

  doc.end();
  return { pdfPath };
}
