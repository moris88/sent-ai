// Segnaposto rimasti nella bozza: quelli di oscuramento (es. [EMAIL_1]) e quelli da compilare (es. [Nome], {{data}}).
const REDACTION_PLACEHOLDER = /\[(?:EMAIL|IBAN|CODICE_FISCALE|PARTITA_IVA|CARTA|TELEFONO|PASSWORD|TOKEN)_\d+\]/g;

const TEMPLATE_PATTERNS: RegExp[] = [
  // [Nome], [Data]: esclude i link Markdown come [testo](url)
  /\[[^[\]\n]{1,40}\](?!\()/g,
  /\{\{[^{}\n]{1,40}\}\}/g,
  /_{3,}/g,
  /\bXXX+\b/g,
];

export const findPlaceholders = (text: string): string[] => {
  const found = new Set<string>();
  [REDACTION_PLACEHOLDER, ...TEMPLATE_PATTERNS].forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      found.add(match[0]);
    }
  });
  return [...found];
};
