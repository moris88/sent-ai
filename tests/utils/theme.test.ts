import { describe, expect, it } from 'vitest';
import {
  applyPrimaryColor,
  buildPalette,
  DEFAULT_PRIMARY_COLOR,
  initPrimaryColor,
  loadPrimaryColor,
  resetPrimaryColor,
  savePrimaryColor,
} from '../../src/utils/theme';

const cssVar = (shade: number) =>
  document.documentElement.style.getPropertyValue(`--color-primary-${shade}`);

describe('buildPalette', () => {
  it('usa il colore scelto come tonalità 600 e genera tutte le tonalità', () => {
    const palette = buildPalette('#059669');

    expect(palette[600]).toBe('#059669');
    expect(Object.keys(palette)).toHaveLength(11);
  });

  it('schiarisce le tonalità basse e scurisce quelle alte', () => {
    const palette = buildPalette('#2563eb');

    expect(palette[50]).not.toBe(palette[600]);
    expect(palette[950]).not.toBe(palette[600]);
    expect(palette[50].toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('applicazione del colore', () => {
  it('imposta le variabili CSS e ripristina il default', () => {
    applyPrimaryColor('#7c3aed');
    expect(cssVar(600)).toBe('#7c3aed');

    resetPrimaryColor();
    expect(cssVar(600)).toBe('');
    expect(loadPrimaryColor()).toBeNull();
  });

  it('applica il colore salvato all avvio', () => {
    savePrimaryColor('#db2777');
    initPrimaryColor();

    expect(cssVar(600)).toBe('#db2777');
  });

  it('non applica nulla all avvio se non c è un colore salvato', () => {
    initPrimaryColor();
    expect(cssVar(600)).toBe('');
    expect(DEFAULT_PRIMARY_COLOR).toBe('#2563eb');
  });
});

describe('persistenza del colore', () => {
  it('salva e ricarica un colore esadecimale valido', () => {
    savePrimaryColor('#ea580c');
    expect(loadPrimaryColor()).toBe('#ea580c');
  });

  it('ignora valori salvati non validi', () => {
    localStorage.setItem('sentai_primary_color', 'rosso');
    expect(loadPrimaryColor()).toBeNull();
  });
});
