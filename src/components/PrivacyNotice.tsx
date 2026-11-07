import { ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type RedactionEvent, subscribeToRedactions } from '../utils/redact';

const FIELD_LABELS: Record<string, string> = {
  draft: 'Bozza',
  context: 'Contesto',
  result: 'Testo',
  instructions: 'Istruzioni',
  question: 'Domanda',
  emails: 'Email salvate',
  keywords: 'Parole chiave',
  prompt: 'Richiesta aggiuntiva',
};

export const PrivacyNotice = () => {
  const [event, setEvent] = useState<RedactionEvent | null>(null);

  useEffect(() => subscribeToRedactions(setEvent), []);

  if (!event) return null;

  // Mostra un solo testo: la bozza se presente, altrimenti il primo campo non vuoto (senza id).
  const visible = event.sentFields.filter(
    ({ field, text }) => field !== 'id' && text.trim() !== ''
  );
  const shown = visible.find(({ field }) => field === 'draft') ?? visible[0];

  if (!shown) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 p-3 mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="bg-primary-600 p-2 rounded-lg shrink-0">
        <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Dati oscurati prima dell'invio all'AI
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Prima dell'invio, l'app sostituisce i dati personali e sensibili con segnaposto come
          [EMAIL_1]. Il provider AI riceve solo i segnaposto, mai i valori originali. Quando arriva
          la risposta, l'app riporta i valori originali nel risultato, sul tuo dispositivo. Il testo
          qui sotto è quello inviato, cioè con i segnaposto. Nomi di persona e dati non
          riconoscibili dalle regole non vengono oscurati.
        </p>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Testo inviato all'AI ({FIELD_LABELS[shown.field] ?? shown.field}):
        </p>
        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs p-2 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
          {shown.text}
        </pre>
      </div>
      <button
        type="button"
        onClick={() => setEvent(null)}
        className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 shrink-0"
        title="Chiudi"
        aria-label="Chiudi l'avviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
