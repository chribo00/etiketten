import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { toEan13FromArticleNumber } from '../utils/ean';

export function generateLabelsPdf(items: { name: string; price?: number; ean?: string; articleNumber?: string; qty: number }[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const canvas = document.createElement('canvas');
  const labelW = 70;
  const labelH = 35;
  const marginX = 10;
  const marginY = 10;
  let x = marginX;
  let y = marginY;
  let col = 0;
  let row = 0;
  items.forEach((it) => {
    for (let i = 0; i < it.qty; i++) {
      doc.text(it.name, x + 2, y + 6, { maxWidth: labelW - 4 });
      if (it.price != null) doc.text(`€ ${it.price.toFixed(2)}`, x + 2, y + 12);
      let code = it.ean;
      let format: any = 'EAN13';
      if (!code && it.articleNumber) {
        const e = toEan13FromArticleNumber(it.articleNumber);
        if (e) code = e;
      }
      if (!code && it.articleNumber) {
        code = it.articleNumber;
        format = 'CODE128';
      }
      if (code) {
        JsBarcode(canvas, code, { format, displayValue: true, height: 20, width: 1 });
        const img = canvas.toDataURL('image/png');
        doc.addImage(img, 'PNG', x + 2, y + 14, labelW - 4, 20);
      }
      if (it.articleNumber) doc.text(it.articleNumber, x + 2, y + labelH - 2);
      col++;
      x += labelW;
      if (col >= 3) {
        col = 0;
        x = marginX;
        row++;
        y += labelH;
        if (row >= 8) {
          doc.addPage();
          row = 0;
          y = marginY;
        }
      }
    }
  });
  doc.save('etiketten.pdf');
}
