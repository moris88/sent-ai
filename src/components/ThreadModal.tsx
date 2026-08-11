import { Upload } from 'lucide-react';

export const ThreadModal = ({ isOpen, onClose, onConfirm, value, onChange, onPaste }: any) =>
  isOpen && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Aggiungi risposta cliente
          </h2>
          <button
            type="button"
            onClick={() => onPaste('context')}
            className="cursor-pointer text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 px-2 py-1 rounded shadow-sm flex items-center gap-1"
          >
            <Upload className="w-3 h-3" /> Incolla
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Incolla qui una eventuale risposta del cliente... o semplicemente scrivi un contesto aggiuntivo per l'AI. Non è obbligatorio, ma può aiutare a generare una risposta più pertinente."
          className="w-full h-40 p-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
        <div className="flex gap-3 pt-2">
          <button
            className="cursor-pointer flex-1 py-2 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 font-semibold"
            type="button"
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            className="cursor-pointer flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            type="button"
            onClick={onConfirm}
          >
            Aggiungi al Contesto
          </button>
        </div>
      </div>
    </div>
  );
