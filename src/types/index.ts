export interface EmailDraft {
  id: string;
  title: string;
  context: string;
  draft: string;
  result: string;
  persona: string;
  tone: string;
  detail: string;
  language: string;
  structure: string;
  temperature: number;
  keywords: string;
  generateSubject: boolean;
  updatedAt: number;
}

export const PERSONAS = [
  { id: 'dev', label: 'Sviluppatore', icon: '💻' },
  { id: 'pm', label: 'Project Manager', icon: '📋' },
  { id: 'support', label: 'Supporto Tecnico', icon: '🛠️' },
  { id: 'sales', label: 'Sales/Account', icon: '🤝' },
  { id: 'it', label: 'Tecnico IT', icon: '🖥️' },
];

export const TONES = [
  { id: 'professional', label: 'Professionale' },
  { id: 'friendly', label: 'Amichevole' },
  { id: 'technical', label: 'Tecnico' },
  { id: 'urgent', label: 'Urgente' },
];

export const DETAIL_LEVELS = [
  { id: 'brief', label: 'Sintetico' },
  { id: 'balanced', label: 'Equilibrato' },
  { id: 'detailed', label: 'Dettagliato' },
];

export const LANGUAGES = [
  { id: 'it', label: 'Italiano' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
];
