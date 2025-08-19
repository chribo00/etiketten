export interface Article {
  id: string;
  articleNumber: string;
  shortText?: string;
  ean?: string;
  listPrice?: number;
  imagePath?: string;
  brand?: string;
  manufacturer?: string;
}

export interface CartItem {
  id: string;
  articleId: string;
  quantity: number;
}

export interface LabelJob {
  items: { articleId: string; quantity: number }[];
  printFields: {
    showArticleNumber: boolean;
    showEAN: boolean;
    showImage: boolean;
    showListPrice: boolean;
    showShortText: boolean;
  };
  bleed?: number;
  pageLayout?: '1-per-page' | '2x4' | 'custom';
}
