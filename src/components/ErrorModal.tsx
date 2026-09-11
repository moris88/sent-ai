import { AlertCircle, X } from 'lucide-react';

interface ErrorModalProps {
  message: string | null;
  onClose: () => void;
}

export const ErrorModal = ({ message, onClose }: ErrorModalProps) => {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 shadow-2xl p-5 space-y-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ai-error-title"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0 flex-1">
            <h2 id="ai-error-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Errore integrazione AI
            </h2>
            <p className="mt-2 wrap-break-word whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
