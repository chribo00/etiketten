import Store from 'electron-store';

export type LabelLayoutSettings = {
  pageMargin: { top: number; right: number; bottom: number; left: number };
  gap: { row: number; col: number };
  hideArticleNumberBelowBarcode: boolean;
  footerMarginTop: number;
};

const defaults: LabelLayoutSettings = {
  pageMargin: { top: 8, right: 8, bottom: 8, left: 8 },
  gap: { row: 10, col: 10 },
  hideArticleNumberBelowBarcode: true,
  footerMarginTop: 6,
};

const store = new Store<LabelLayoutSettings>({ name: 'label-layout', defaults });

export function getLabelLayout(): LabelLayoutSettings {
  return {
    pageMargin: store.get('pageMargin', defaults.pageMargin),
    gap: store.get('gap', defaults.gap),
    hideArticleNumberBelowBarcode: store.get(
      'hideArticleNumberBelowBarcode',
      defaults.hideArticleNumberBelowBarcode,
    ),
    footerMarginTop: store.get('footerMarginTop', defaults.footerMarginTop),
  };
}

export function setLabelLayout(next: LabelLayoutSettings) {
  store.set(next);
  applyLayoutCssVariables(next);
}

export function applyLayoutCssVariables(s: LabelLayoutSettings = getLabelLayout()) {
  const r = document.documentElement;
  r.style.setProperty('--page-margin-top-mm', `${s.pageMargin.top}mm`);
  r.style.setProperty('--page-margin-right-mm', `${s.pageMargin.right}mm`);
  r.style.setProperty('--page-margin-bottom-mm', `${s.pageMargin.bottom}mm`);
  r.style.setProperty('--page-margin-left-mm', `${s.pageMargin.left}mm`);
  r.style.setProperty('--row-gap-mm', `${s.gap.row}mm`);
  r.style.setProperty('--col-gap-mm', `${s.gap.col}mm`);
  r.style.setProperty('--footer-margin-top-mm', `${s.footerMarginTop}mm`);
  r.style.setProperty(
    '--label-hide-article-number',
    s.hideArticleNumberBelowBarcode ? 'none' : 'block',
  );
}
