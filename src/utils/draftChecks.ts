import { findPlaceholders } from './placeholders';
import { findSensitiveData } from './redact';

export type CheckSeverity = 'error' | 'warning' | 'info';
export type CheckIssue = { id: string; severity: CheckSeverity; message: string };

const FORBIDDEN_TERMS_KEY = 'sentai_forbidden_terms';
const SUBJECT_MAX_LENGTH = 70;
const GREETING = /^(gentile|buongiorno|buonasera|ciao|salve|hi|hello|dear)\b/i;
const CLOSING =
  /(cordiali saluti|distinti saluti|un saluto|saluti|grazie|a presto|buona giornata|buon lavoro|best regards|kind regards|regards|thanks)/i;

const SENSITIVE_LABELS: Record<string, string> = {
  EMAIL: 'email',
  PASSWORD: 'password',
  TOKEN: 'chiavi o token',
  TELEFONO: 'numeri di telefono',
  IBAN: 'IBAN',
  CODICE_FISCALE: 'codici fiscali',
  PARTITA_IVA: 'partite IVA',
  CARTA: 'numeri di carta',
};

// Termini da evitare, separati da virgola, impostati nelle impostazioni.
export const loadForbiddenTerms = (): string[] => {
  try {
    return (localStorage.getItem(FORBIDDEN_TERMS_KEY) ?? '')
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

export const saveForbiddenTerms = (raw: string): void => {
  try {
    localStorage.setItem(FORBIDDEN_TERMS_KEY, raw);
  } catch {
    // ignora: i termini restano attivi per questa sessione
  }
};

const isMostlyUppercase = (text: string): boolean => {
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 10) return false;
  const upper = letters.replace(/[^A-ZÀ-Ý]/g, '').length;
  return upper / letters.length > 0.6;
};

// Controlli deterministici: istantanei, gratuiti, senza chiamate al modello. Non modificano la bozza.
export const runLocalChecks = (draft: { subject: string; draft: string }): CheckIssue[] => {
  const issues: CheckIssue[] = [];
  const body = draft.draft.trim();
  const subject = draft.subject.trim();

  // Dati personali ancora in chiaro
  Object.entries(findSensitiveData(body)).forEach(([type, count]) => {
    issues.push({
      id: `sensitive-${type}`,
      severity: 'warning',
      message: `Ci sono ancora ${count} ${SENSITIVE_LABELS[type] ?? type} in chiaro: prima dell'invio controlla che siano necessari.`,
    });
  });

  // Segnaposto da compilare o rimasti dall'oscuramento
  const placeholders = findPlaceholders(body);
  if (placeholders.length > 0) {
    issues.push({
      id: 'placeholders',
      severity: 'error',
      message: `Segnaposto da sostituire: ${placeholders.slice(0, 5).join(', ')}.`,
    });
  }

  // Oggetto
  if (!subject) {
    issues.push({ id: 'subject-missing', severity: 'error', message: "Manca l'oggetto." });
  } else if (subject.length > SUBJECT_MAX_LENGTH) {
    issues.push({
      id: 'subject-long',
      severity: 'warning',
      message: `L'oggetto è lungo ${subject.length} caratteri: meglio restare sotto i ${SUBJECT_MAX_LENGTH}.`,
    });
  } else if (isMostlyUppercase(subject)) {
    issues.push({
      id: 'subject-uppercase',
      severity: 'warning',
      message: "L'oggetto ha troppe maiuscole.",
    });
  }

  // Struttura
  if (!body) {
    issues.push({ id: 'body-empty', severity: 'error', message: 'La bozza è vuota.' });
  } else {
    if (body.split(/\s+/).length < 15) {
      issues.push({ id: 'body-short', severity: 'warning', message: 'La bozza è molto breve.' });
    }
    const lines = body.split('\n').filter((line) => line.trim() !== '');
    if (!GREETING.test(lines[0] ?? '')) {
      issues.push({
        id: 'greeting-missing',
        severity: 'warning',
        message: 'Manca un saluto iniziale.',
      });
    }
    if (!CLOSING.test(lines.slice(-3).join(' '))) {
      issues.push({
        id: 'closing-missing',
        severity: 'warning',
        message: 'Mancano una formula di chiusura o una firma.',
      });
    }
  }

  // Stile
  if ((body.match(/!/g) ?? []).length >= 3) {
    issues.push({
      id: 'exclamations',
      severity: 'warning',
      message: 'Ci sono molti punti esclamativi.',
    });
  }
  if ((body.match(/\b[A-ZÀ-Ý]{4,}\b/g) ?? []).length >= 3) {
    issues.push({
      id: 'shouting',
      severity: 'warning',
      message: 'Ci sono molte parole in maiuscolo.',
    });
  }
  const longSentences = body
    .split(/[.!?]+\s/)
    .filter((sentence) => sentence.trim().split(/\s+/).length > 35);
  if (longSentences.length > 0) {
    issues.push({
      id: 'long-sentences',
      severity: 'info',
      message: 'Alcune frasi sono molto lunghe: spezzale per renderle più leggibili.',
    });
  }

  // Termini da evitare
  const lowerBody = body.toLowerCase();
  loadForbiddenTerms()
    .filter((term) => lowerBody.includes(term.toLowerCase()))
    .forEach((term) => {
      issues.push({
        id: `forbidden-${term}`,
        severity: 'warning',
        message: `Contiene il termine da evitare "${term}".`,
      });
    });

  return issues;
};
