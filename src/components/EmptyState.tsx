import { Mail, PenLine, Plus, ShieldCheck, Sparkles } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'Raffina', text: 'Migliora tono e struttura di una bozza esistente.' },
  {
    icon: PenLine,
    title: 'Scrivi da zero',
    text: 'Parti dal contesto e lascia che l’AI scriva la risposta.',
  },
  {
    icon: ShieldCheck,
    title: 'Dati protetti',
    text: 'Dati personali e sensibili vengono oscurati prima dell’invio.',
  },
];

interface EmptyStateProps {
  onCreate: () => void;
}

export const EmptyState = ({ onCreate }: EmptyStateProps) => {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-200/60 blur-3xl dark:bg-primary-900/40"
      />
      <section className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
          <Mail className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
          Nessuna bozza ancora
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
          Crea la tua prima bozza per scrivere o raffinare un’email con l’AI. Le bozze restano
          salvate sul tuo dispositivo.
        </p>

        <button
          type="button"
          onClick={onCreate}
          className="cursor-pointer mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary-600/25 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crea la prima bozza
        </button>

        <ul className="mt-10 grid gap-3 text-left md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50">
                <Icon
                  className="h-4 w-4 text-primary-700 dark:text-primary-300"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-500 dark:text-slate-400">
        Creato da{' '}
        <a
          href="https://www.mauriziotolomeo.it"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
        >
          Maurizio Tolomeo
        </a>
      </footer>
    </div>
  );
};
