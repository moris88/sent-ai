interface OldDraftsCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expiredCount: number;
}

/**
 * Modal to notify the user about web-only old drafts cleanup.
 */
const OldDraftsCleanupModal = ({
  isOpen,
  onClose,
  onConfirm,
  expiredCount,
}: OldDraftsCleanupModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cleanup-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h2 id="cleanup-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
          Pulizia Automatica Bozze Scadute
        </h2>
        <div className="text-slate-600 dark:text-slate-300 text-sm space-y-3">
          <p>
            Stai utilizzando la versione Web dell'applicazione, che dispone di uno spazio di
            archiviazione limitato nel browser.
          </p>
          <p>
            Per ottimizzare lo spazio e prevenire malfunzionamenti, le bozze create o modificate più
            di una settimana fa verranno rimosse.
          </p>
          <p className="font-semibold text-amber-600 dark:text-amber-400">
            Ci sono {expiredCount} bozze scadute che verranno eliminate definitivamente.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            className="cursor-pointer flex-1 py-2 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
            type="button"
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            className="cursor-pointer flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-blue-900/50 hover:bg-white dark:hover:bg-blue-800 p-2 md:px-3 md:py-1.5 rounded-md font-medium border border-blue-200 dark:border-blue-700 transition-colors"
            type="button"
            onClick={onConfirm}
          >
            Ok, procedi
          </button>
        </div>
      </div>
    </div>
  );
};

export default OldDraftsCleanupModal;
