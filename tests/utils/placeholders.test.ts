import { describe, expect, it } from 'vitest';
import { findPlaceholders } from '../../src/utils/placeholders';

describe('findPlaceholders', () => {
  it('trova segnaposto di oscuramento e segnaposto da compilare', () => {
    const found = findPlaceholders('Ciao [Nome], scrivi a [EMAIL_1] il {{data}} ___ XXX');

    expect(found).toEqual(
      expect.arrayContaining(['[Nome]', '[EMAIL_1]', '{{data}}', '___', 'XXX'])
    );
  });

  it('ignora i link Markdown', () => {
    expect(findPlaceholders('Vedi [il sito](https://example.it)')).toEqual([]);
  });

  it('restituisce ogni segnaposto una sola volta', () => {
    expect(findPlaceholders('[Nome] e ancora [Nome]')).toEqual(['[Nome]']);
  });

  it('restituisce un elenco vuoto se non ci sono segnaposto', () => {
    expect(findPlaceholders('Testo normale')).toEqual([]);
  });
});
