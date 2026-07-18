export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: any) =>
  isOpen && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eliminare bozza?</h2>
        <p className="text-slate-600 dark:text-slate-300">
          Sei sicuro di voler eliminare questa bozza? L'operazione non può essere annullata.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 font-semibold"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
