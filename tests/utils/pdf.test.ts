import { describe, expect, it, vi } from 'vitest';

const { getDocument } = vi.hoisted(() => ({ getDocument: vi.fn() }));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument,
}));

import { extractTextFromPDF } from '../../src/utils/pdf';

describe('extractTextFromPDF', () => {
  it('concatena il testo di tutte le pagine', async () => {
    const pages: Record<number, string[]> = { 1: ['Ciao', 'mondo'], 2: ['Fine'] };
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: async (n: number) => ({
          getTextContent: async () => ({ items: pages[n].map((str) => ({ str })) }),
        }),
      }),
    });
    const file = new File(['%PDF'], 'a.pdf', { type: 'application/pdf' });

    await expect(extractTextFromPDF(file)).resolves.toBe('Ciao mondo\nFine\n');
    expect(getDocument).toHaveBeenCalledWith({ data: expect.any(ArrayBuffer) });
  });
});
