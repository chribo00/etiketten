export const isDigits = (str: string) => /^\d+$/.test(str);

export const eanChecksum12 = (digits12: string) => {
  const digits = digits12.split('').map((d) => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digits[i] * weight;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
};

export const toEan13FromArticleNumber = (artnr: string): string | null => {
  const digits = (artnr || '').replace(/\D/g, '');
  if (!digits) return null;
  const d12 = digits.length >= 12 ? digits.slice(-12) : digits.padStart(12, '0');
  const check = eanChecksum12(d12);
  return `${d12}${check}`;
};

export const isValidEan13 = (str: string | undefined | null) => {
  if (!str) return false;
  const digits = str.replace(/\D/g, '');
  if (digits.length !== 13) return false;
  const check = eanChecksum12(digits.slice(0, 12));
  return check === parseInt(digits[12], 10);
};
