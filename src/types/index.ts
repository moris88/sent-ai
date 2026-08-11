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
  {
    id: 'dev',
    label: 'Sviluppatore',
    icon: '💻',
    description: "L'ai impersona uno sviluppatore software",
  },
  {
    id: 'pm',
    label: 'Project Manager',
    icon: '📋',
    description: "L'ai impersona un project manager",
  },
  {
    id: 'support',
    label: 'Supporto Tecnico',
    icon: '🛠️',
    description: "L'ai impersona un tecnico di supporto",
  },
  {
    id: 'sales',
    label: 'Sales/Account',
    icon: '🤝',
    description: "L'ai impersona un professionista delle vendite",
  },
  { id: 'it', label: 'Tecnico IT', icon: '🖥️', description: "L'ai impersona un tecnico IT" },
];

export const TONES = [
  { id: 'formal', label: 'Formale', icon: '👔', description: "L'ai userà un tono formale" },
  { id: 'friendly', label: 'Amichevole', icon: '😊', description: "L'ai userà un tono amichevole" },
  { id: 'technical', label: 'Tecnico', icon: '⚙️', description: "L'ai userà un tono tecnico" },
  {
    id: 'persuasive',
    label: 'Persuasivo',
    icon: '💡',
    description: "L'ai userà un tono persuasivo",
  },
  { id: 'empathetic', label: 'Empatico', icon: '💙', description: "L'ai userà un tono empatico" },
  { id: 'concise', label: 'Conciso', icon: '✂️', description: "L'ai userà un tono conciso" },
  {
    id: 'sarcastic',
    label: 'Sarcastico',
    icon: '😏',
    description: "L'ai userà un tono sarcastico",
  },
  { id: 'critical', label: 'Critico', icon: '🧐', description: "L'ai userà un tono critico" },
  { id: 'analytical', label: 'Analitico', icon: '📊', description: "L'ai userà un tono analitico" },
  {
    id: 'reflective',
    label: 'Riflessivo',
    icon: '🧘',
    description: "L'ai userà un tono riflessivo",
  },
  { id: 'thoughtful', label: 'Premuroso', icon: '🤔', description: "L'ai userà un tono premuroso" },
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
  { id: 'es', label: 'Español' },
  { id: 'de', label: 'Deutsch' },
  { id: 'pt', label: 'Português' },
];
