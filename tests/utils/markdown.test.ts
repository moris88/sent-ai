import { describe, expect, it } from 'vitest';
import { markdownToHtml, markdownToPlainText, preserveLineBreaks } from '../../src/utils/markdown';

describe('preserveLineBreaks', () => {
  it('trasforma un a capo singolo in un a capo Markdown reale', () => {
    expect(preserveLineBreaks('riga uno\nriga due')).toBe('riga uno  \nriga due');
  });

  it('lascia invariati i paragrafi separati da una riga vuota', () => {
    expect(preserveLineBreaks('a\n\nb')).toBe('a\n\nb');
  });
});

describe('markdownToHtml', () => {
  it('converte titoli, grassetto e liste', () => {
    const html = markdownToHtml('# Ciao\n\n**forte**\n\n- uno');

    expect(html).toContain('<h1>Ciao</h1>');
    expect(html).toContain('<strong>forte</strong>');
    expect(html).toContain('<li>uno</li>');
  });

  it('non lascia passare HTML pericoloso', () => {
    const html = markdownToHtml('<script>alert(1)</script>');

    expect(html).not.toContain('<script');
  });
});

describe('markdownToPlainText', () => {
  it('rimuove la sintassi Markdown mantenendo il testo', () => {
    const text = markdownToPlainText('## Titolo\n**Ciao** _mondo_ [link](https://a.it)');

    expect(text).toBe('Titolo\nCiao mondo link');
  });

  it('rimuove le citazioni e gli spazi ai bordi', () => {
    expect(markdownToPlainText('  > citazione  ')).toBe('citazione');
  });
});
