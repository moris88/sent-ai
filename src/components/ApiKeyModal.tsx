interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettings: () => void;
}

const ApiKeyModal = ({ isOpen, onClose, onSettings }: ApiKeyModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h2 id="api-key-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
          API Key Necessaria
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Per utilizzare le funzionalità basate sull'intelligenza artificiale, è necessario
          configurare una chiave API valida nelle impostazioni.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 py-2 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
          >
            Chiudi
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="cursor-pointer flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm transition-colors"
          >
            Vai alle Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
