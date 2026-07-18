export const ThreadModal = ({ isOpen, onClose, onConfirm, value, onChange }: any) =>
  isOpen && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Aggiungi risposta cliente
        </h2>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Incolla qui la risposta del cliente..."
          className="w-full h-40 p-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
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
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
          >
            Aggiungi al Contesto
          </button>
        </div>
      </div>
    </div>
  );
