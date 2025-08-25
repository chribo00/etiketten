import { jsPDF } from 'jspdf';
import { A4_3x8, LabelConfig, fromArticleToEan13, isValidEan13, renderEanPng } from './labels';

export type CartItem = {
  name: string;
  price?: number;
  ean?: string;
  articleNumber?: string;
  qty: number;
};

export async function generateLabelsPdf(
  cartItems: CartItem[],
  cfg: Partial<LabelConfig> = {}
) {
  const conf: LabelConfig = { ...A4_3x8, ...cfg };
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');

  const currency = new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
  });

  let col = 0;
  let row = 0;
  let barcodeCount = 0;

  for (const item of cartItems) {
    for (let q = 0; q < item.qty; q++) {
      const x = conf.marginX + col * (conf.labelW + conf.gutterX);
      const y = conf.marginY + row * (conf.labelH + conf.gutterY);

      let cursorY = y + 2;

      if (item.articleNumber) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(item.articleNumber, x + 3, cursorY, { baseline: 'top' });
        const artHeight = doc.getTextDimensions(item.articleNumber).h;
        cursorY += artHeight + 2;
      }

      let fontStyle: 'normal' | 'italic' = 'normal';
      let fontSize = 11;
      if (item.name && item.name.toLowerCase().includes('nicht mehr verwenden')) {
        fontStyle = 'italic';
        fontSize = 9;
      }
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      const maxWidth = conf.labelW - 6;
      let lines = doc.splitTextToSize(item.name || '', maxWidth) as string[];
      if (lines.length > 2) {
        const second = lines[1];
        lines = [lines[0], second.substring(0, second.length - 3) + '...'];
      }
      doc.text(lines as any, x + 3, cursorY, {
        maxWidth,
        baseline: 'top',
      });
      const nameHeight = doc.getTextDimensions(lines).h;
      cursorY += nameHeight + 2;

      if (item.price != null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        const priceStr = currency.format(item.price);
        doc.text(priceStr, x + 3, cursorY, { baseline: 'top' });
        const priceHeight = doc.getTextDimensions(priceStr).h;
        cursorY += priceHeight + 3;
      }

      let code: string | undefined = undefined;
      if (item.ean && isValidEan13(item.ean)) {
        code = item.ean;
      } else if (item.articleNumber) {
        code = fromArticleToEan13(item.articleNumber) || item.articleNumber;
      }

      if (code) {
        const png = await renderEanPng(
          code,
          conf.labelW - 6,
          conf.barcodeH
        );
        const barcodeY = cursorY;
        doc.addImage(
          png,
          'PNG',
          x + 3,
          barcodeY,
          conf.labelW - 6,
          conf.barcodeH
        );
        cursorY = barcodeY + conf.barcodeH;
        barcodeCount++;
        if (barcodeCount % 8 === 0) await Promise.resolve();
      }



      col++;
      if (col >= conf.cols) {
        col = 0;
        row++;
        if (row >= conf.rows) {
          doc.addPage();
          row = 0;
        }
      }
    }
  }

  doc.save('etiketten.pdf');
}

