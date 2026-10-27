import { KeyRound } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSettings: () => void;
}

/**
 * Popup bloccante: senza una chiave API salvata l'app è inutilizzabile,
 * quindi non può essere chiuso finché la chiave non viene configurata.
 */
const ApiKeyModal = ({ isOpen, onSettings }: ApiKeyModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      aria-describedby="api-key-modal-description"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <h2 id="api-key-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
            API Key necessaria
          </h2>
        </div>
        <p id="api-key-modal-description" className="text-slate-600 dark:text-slate-300 text-sm">
          SentAI funziona solo con l'intelligenza artificiale: inserisci e salva una chiave API
          nelle impostazioni per iniziare a usare l'app.
        </p>
        <button
          type="button"
          onClick={onSettings}
          className="cursor-pointer w-full py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm transition-colors"
        >
          Vai alle Impostazioni
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;
