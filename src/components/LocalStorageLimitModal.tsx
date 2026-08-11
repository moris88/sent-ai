interface LocalStorageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  usagePercent: number;
}

/**
 * Modal to warn the user when localStorage is reaching its limit.
 */
const LocalStorageLimitModal = ({ isOpen, onClose, usagePercent }: LocalStorageLimitModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h2
          id="storage-modal-title"
          className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2"
        >
          ⚠️ Spazio Browser Quasi Esaurito
        </h2>
        <div className="text-slate-600 dark:text-slate-300 text-sm space-y-3">
          <p>
            Attenzione: l'applicazione sta esaurendo lo spazio di archiviazione disponibile nel
            browser.
          </p>
          <div className="bg-slate-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Utilizzo LocalStorage</span>
              <span>{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-gray-600 h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <p>
            Il browser impone un limite massimo di circa 5MB per l'archiviazione locale
            (localStorage). Quando questo limite viene superato, non sarà possibile salvare nuove
            bozze o aggiornare quelle esistenti.
          </p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Ti consigliamo di eliminare le bozze più grandi o quelle vecchie per liberare spazio.
          </p>
        </div>
        <div className="flex pt-2">
          <button
            className="cursor-pointer flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors cursor-pointer"
            type="button"
            onClick={onClose}
          >
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalStorageLimitModal;
