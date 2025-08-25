import JsBarcode from 'jsbarcode';
import { renderBarcodePng } from '../src/renderer/lib/labels';

jest.mock('jsbarcode');
const mocked = JsBarcode as unknown as jest.Mock;

// Minimal DOM mocks
beforeAll(() => {
  const canvas = { getContext: () => null, toDataURL: () => '' };
  (global as any).document = { createElement: () => canvas };
});

beforeEach(() => {
  mocked.mockClear();
});

test('renders CODE128 for alphanumeric article numbers', async () => {
  await renderBarcodePng('abc123', 40, 20);
  const [canvas, code, opts] = mocked.mock.calls[0];
  expect(code).toBe('abc123');
  expect(opts.format).toBe('CODE128');
  expect(opts.text).toBe('abc123');
});

test('renders EAN13 for 13-digit numbers', async () => {
  await renderBarcodePng('0000000123457', 40, 20);
  const [canvas, code, opts] = mocked.mock.calls[0];
  expect(code).toBe('0000000123457');
  expect(opts.format).toBe('EAN13');
  expect(opts.text).toBe('0000000123457');
});

test('falls back to CODE128 for short numbers', async () => {
  await renderBarcodePng('000123', 40, 20);
  const [canvas, code, opts] = mocked.mock.calls[0];
  expect(code).toBe('000123');
  expect(opts.format).toBe('CODE128');
});
