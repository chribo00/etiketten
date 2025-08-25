export interface ParsedQuery {
  match?: string;
  terms: string[];
}

// parse search string to FTS5 match expression
export function parseSearch(input: string): ParsedQuery {
  const groups: string[][] = [[]];
  const terms: string[] = [];
  let i = 0;
  const len = input.length;

  function isTokenChar(ch: string) {
    return /[\p{L}\p{N}_\-./]/u.test(ch);
  }

  while (i < len) {
    const ch = input[i];
    if (ch === '"') {
      // phrase search with escaping
      i++;
      let phrase = '';
      let escaped = false;
      while (i < len) {
        const c = input[i];
        if (escaped) {
          phrase += c;
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === '"') {
          break;
        } else {
          phrase += c;
        }
        i++;
      }
      if (i < len && input[i] === '"') i++; // skip closing quote
      if (phrase.length >= 2) {
        groups[groups.length - 1].push(`"${phrase.replace(/"/g, '""')}"`);
        terms.push(phrase);
      }
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (!isTokenChar(ch) && ch !== '-' && ch !== '*') {
      i++;
      continue;
    }
    let not = false;
    if (ch === '-') {
      not = true;
      i++;
    }
    let word = '';
    while (i < len) {
      const c = input[i];
      if (isTokenChar(c) || c === '*') {
        word += c;
        i++;
      } else {
        break;
      }
    }
    const upper = word.toUpperCase();
    if (!not && upper === 'OR') {
      groups.push([]);
      continue;
    }
    let prefix = false;
    if (word.endsWith('*')) {
      prefix = true;
      word = word.slice(0, -1);
    }
    if (word.length >= 2) {
      const token = word.replace(/"/g, '');
      const part = prefix ? `${token}*` : token;
      if (not) groups[groups.length - 1].push(`NOT ${part}`);
      else {
        groups[groups.length - 1].push(part);
        terms.push(word);
      }
    }
  }

  const match = groups
    .filter((g) => g.length)
    .map((g) => g.join(' '))
    .join(' OR ');

  return { match: match || undefined, terms };
}
