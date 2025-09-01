export type Layout = {
  pageMargin: { top: number; right: number; bottom: number; left: number };
  labelSize: { width: number; height: number };
  spacing: { horizontal: number; vertical: number };
  columns: number;
  rows: number;
};

export const defaultLayout: Layout = {
  pageMargin: { top: 8, right: 8, bottom: 8, left: 8 },
  labelSize: { width: 70, height: 37 },
  spacing: { horizontal: 4, vertical: 8 },
  columns: 3,
  rows: 8,
};

async function ensureLayout(): Promise<Layout> {
  const data = (await window.api.settings.getAll()) as Record<string, unknown>;
  return {
    pageMargin: { ...defaultLayout.pageMargin, ...(data.pageMargin as any) },
    labelSize: { ...defaultLayout.labelSize, ...(data.labelSize as any) },
    spacing: { ...defaultLayout.spacing, ...(data.spacing as any) },
    columns: (data.columns as number) ?? defaultLayout.columns,
    rows: (data.rows as number) ?? defaultLayout.rows,
  };
}

export async function loadLayout(): Promise<Layout> {
  return ensureLayout();
}

export async function saveLayout(patch: Partial<Layout>): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    await window.api.settings.set(key, value as unknown);
  }
}

export async function resetLayout(): Promise<void> {
  await window.api.settings.reset();
}

export async function applyLayoutCssVariables(layout?: Layout): Promise<void> {
  const s = layout ?? (await ensureLayout());
  const r = document.documentElement;
  r.style.setProperty('--page-margin-top-mm', `${s.pageMargin.top}mm`);
  r.style.setProperty('--page-margin-right-mm', `${s.pageMargin.right}mm`);
  r.style.setProperty('--page-margin-bottom-mm', `${s.pageMargin.bottom}mm`);
  r.style.setProperty('--page-margin-left-mm', `${s.pageMargin.left}mm`);
  r.style.setProperty('--label-width-mm', `${s.labelSize.width}mm`);
  r.style.setProperty('--label-height-mm', `${s.labelSize.height}mm`);
  r.style.setProperty('--spacing-horizontal-mm', `${s.spacing.horizontal}mm`);
  r.style.setProperty('--spacing-vertical-mm', `${s.spacing.vertical}mm`);
  r.style.setProperty('--label-columns', String(s.columns));
  r.style.setProperty('--label-rows', String(s.rows));
}
