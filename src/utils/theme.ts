// Colore principale personalizzabile: la palette "primary" di Tailwind viene sovrascritta
// con variabili CSS, così tutti i componenti che usano primary-* cambiano insieme.

const STORAGE_KEY = 'sentai_primary_color';
const HEX_REGEX = /^#[0-9a-f]{6}$/i;
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export const DEFAULT_PRIMARY_COLOR = '#2563eb';

export const PRIMARY_PRESETS = [
  { label: 'Blu', hex: '#2563eb' },
  { label: 'Verde', hex: '#059669' },
  { label: 'Viola', hex: '#7c3aed' },
  { label: 'Arancio', hex: '#ea580c' },
  { label: 'Rosa', hex: '#db2777' },
  { label: 'Ardesia', hex: '#475569' },
];

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

// Tonalità chiare: miscela verso il bianco; scure: verso il nero. Il 600 è il colore scelto.
const SHADE_MIX: Record<number, { target: Rgb; amount: number }> = {
  50: { target: WHITE, amount: 0.95 },
  100: { target: WHITE, amount: 0.9 },
  200: { target: WHITE, amount: 0.75 },
  300: { target: WHITE, amount: 0.55 },
  400: { target: WHITE, amount: 0.3 },
  500: { target: WHITE, amount: 0.12 },
  700: { target: BLACK, amount: 0.15 },
  800: { target: BLACK, amount: 0.3 },
  900: { target: BLACK, amount: 0.45 },
  950: { target: BLACK, amount: 0.6 },
};

const toRgb = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = (rgb: Rgb): string =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const mix = (from: Rgb, to: Rgb, amount: number): Rgb => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
];

export const buildPalette = (hex: string): Record<number, string> => {
  const base = toRgb(hex);
  return Object.fromEntries(
    SHADES.map((shade) => {
      if (shade === 600) return [shade, hex];
      const { target, amount } = SHADE_MIX[shade];
      return [shade, toHex(mix(base, target, amount))];
    })
  );
};

export const applyPrimaryColor = (hex: string): void => {
  const root = document.documentElement;
  Object.entries(buildPalette(hex)).forEach(([shade, value]) => {
    root.style.setProperty(`--color-primary-${shade}`, value);
  });
};

export const loadPrimaryColor = (): string | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && HEX_REGEX.test(saved) ? saved : null;
  } catch {
    return null;
  }
};

export const savePrimaryColor = (hex: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, hex);
  } catch {
    // ignora: il colore resta attivo per questa sessione
  }
};

// Ripristina il colore di default rimuovendo sia le variabili sia la preferenza salvata.
export const resetPrimaryColor = (): void => {
  const root = document.documentElement;
  SHADES.forEach((shade) => {
    root.style.removeProperty(`--color-primary-${shade}`);
  });
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
};

// Da chiamare all'avvio: applica il colore salvato, se presente.
export const initPrimaryColor = (): void => {
  const saved = loadPrimaryColor();
  if (saved) applyPrimaryColor(saved);
};
