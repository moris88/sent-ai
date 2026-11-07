// Oscuramento dei dati personali e sensibili prima dell'invio ai provider AI.
// Ogni valore riconosciuto viene sostituito con un segnaposto (es. [EMAIL_1]);
// la risposta del modello viene poi riportata ai valori originali.

type RedactionRule = {
  type: string;
  regex: RegExp;
  // Permette di scartare i match che sembrano validi solo per forma (es. numeri di carta non validi).
  validate?: (match: string) => boolean;
};

const luhnValid = (match: string): boolean => {
  const digits = match.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
};

// Controllo ISO 13616 (mod 97): l'IBAN è valido solo se il resto è 1.
const ibanValid = (match: string): boolean => {
  const iban = match.replace(/\s/g, '').toUpperCase();
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));

  let remainder = 0;
  for (const char of numeric) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }
  return remainder === 1;
};

// L'ordine conta: le regole più specifiche vanno prima di quelle generiche (es. telefono).
const RULES: RedactionRule[] = [
  // Password scritte con un'etichetta (es. "password: abc123"): si oscura solo il valore.
  {
    type: 'PASSWORD',
    regex: /(?<=\b(?:password|passwd|pwd)\s*[:=]\s*)[^\s'"]{3,}/gi,
  },
  // Chiavi e token con un formato riconoscibile o con un'etichetta esplicita.
  {
    type: 'TOKEN',
    regex:
      /\b(?:sk|pk|rk)[-_][A-Za-z0-9_-]{16,}\b|\bAIza[0-9A-Za-z_-]{35}\b|\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bxox[abprs]-[A-Za-z0-9-]{10,}\b|(?<=\bBearer\s+)[A-Za-z0-9._~+/-]{16,}=*|(?<=\b(?:api[_ -]?key|apikey|access[_ -]?token|token|secret)\s*[:=]\s*)[^\s'"]{8,}/gi,
  },
  {
    type: 'EMAIL',
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
  },
  {
    type: 'IBAN',
    regex: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g,
    validate: ibanValid,
  },
  {
    type: 'CODICE_FISCALE',
    regex: /\b[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]\b/gi,
  },
  {
    type: 'PARTITA_IVA',
    regex: /(?<=(?:P\.?\s?IVA|partita\s+iva)[\s:]*)\d{11}\b/gi,
  },
  {
    type: 'CARTA',
    regex: /\b(?:\d[ -]?){12,18}\d\b/g,
    validate: luhnValid,
  },
  {
    type: 'TELEFONO',
    regex:
      /(?:\+|00)\d{1,3}[\s.-]?\d{6,12}\b|(?<![\d.,/-])(?:3\d{2}[\s.-]?\d{6,7}|0\d{1,3}[\s.-]?\d{5,8})\b/g,
  },
];

const PLACEHOLDER_REGEX = new RegExp(
  `\\[(${RULES.map((rule) => rule.type).join('|')})_\\d+\\]`,
  'g'
);

export type RedactionSummary = Record<string, number>;
// Testo effettivamente inviato al modello (già oscurato), campo per campo.
export type SentField = { field: string; text: string };
export type RedactionEvent = { summary: RedactionSummary; sentFields: ReadonlyArray<SentField> };
export type RedactionListener = (event: RedactionEvent) => void;

export type PrivacySession = {
  redact: (text: string) => string;
  restore: (text: string) => string;
  // Numero di valori distinti oscurati per tipo (es. { EMAIL: 2, TELEFONO: 1 }).
  summary: () => RedactionSummary;
};

const listeners = new Set<RedactionListener>();

// Permette all'interfaccia di sapere quali dati sono stati oscurati prima di ogni invio.
export const subscribeToRedactions = (listener: RedactionListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyRedactions = (event: RedactionEvent): void => {
  if (Object.keys(event.summary).length === 0) return;
  listeners.forEach((listener) => {
    listener(event);
  });
};

// Una sessione per ogni chiamata al modello: stesso valore, stesso segnaposto all'interno della chiamata.
export const createPrivacySession = (): PrivacySession => {
  const placeholderByValue = new Map<string, string>();
  const valueByPlaceholder = new Map<string, string>();
  const counters = new Map<string, number>();

  const placeholderFor = (type: string, value: string): string => {
    const key = `${type}|${value}`;
    const existing = placeholderByValue.get(key);
    if (existing) return existing;

    const next = (counters.get(type) ?? 0) + 1;
    counters.set(type, next);
    const placeholder = `[${type}_${next}]`;
    placeholderByValue.set(key, placeholder);
    valueByPlaceholder.set(placeholder, value);
    return placeholder;
  };

  const redact = (text: string): string => {
    if (!text) return text;

    return RULES.reduce((current, rule) => {
      return current.replace(rule.regex, (match) => {
        if (rule.validate && !rule.validate(match)) return match;
        return placeholderFor(rule.type, match);
      });
    }, text);
  };

  const restore = (text: string): string => {
    if (!text) return text;
    return text.replace(
      PLACEHOLDER_REGEX,
      (placeholder) => valueByPlaceholder.get(placeholder) ?? placeholder
    );
  };

  const summary = (): RedactionSummary => Object.fromEntries(counters);

  return { redact, restore, summary };
};

const DEFAULT_SKIP_KEYS: ReadonlyArray<string> = ['provider', 'apiKey', 'model'];

// Avvolge una funzione che riceve un oggetto di opzioni: oscura tutti i campi testuali in ingresso
// e ripristina i valori originali nel testo restituito.
export const withPrivacy = <T extends object>(
  fn: (options: T) => Promise<string>,
  skipKeys: ReadonlyArray<string> = DEFAULT_SKIP_KEYS
) => {
  return async (options: T): Promise<string> => {
    const session = createPrivacySession();
    const redactedEntries = Object.entries(options).map(([key, value]): [string, unknown] => [
      key,
      typeof value === 'string' && !skipKeys.includes(key) ? session.redact(value) : value,
    ]);
    const sentFields = redactedEntries.flatMap(([field, value]): SentField[] =>
      typeof value === 'string' && !skipKeys.includes(field) ? [{ field, text: value }] : []
    );
    notifyRedactions({ summary: session.summary(), sentFields });
    const result = await fn(Object.fromEntries(redactedEntries) as T);
    return session.restore(result);
  };
};

// Conta i dati personali presenti nel testo senza modificarlo: serve per gli avvisi prima dell'invio.
export const findSensitiveData = (text: string): RedactionSummary => {
  const session = createPrivacySession();
  session.redact(text);
  return session.summary();
};
