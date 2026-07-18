import { Copy, History, RefreshCw, Sparkles } from 'lucide-react';
import type { EmailDraft } from '../types';

interface EditorProps {
  draft: EmailDraft;
  isLoading: boolean;
  onUpdate: (updates: Partial<EmailDraft>) => void;
  onRefine: () => void;
  onPaste: (target: 'context' | 'draft') => void;
  onContinueThread: () => void;
  onCopyResult: () => void;
}

export const EmailEditor = ({
  draft,
  isLoading,
  onUpdate,
  onRefine,
  onPaste,
  onContinueThread,
  onCopyResult,
}: EditorProps) => (
  <div className="flex-1 p-4 w-full">
    <div className="max-w-5xl mx-auto space-y-6 w-full pb-8">
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Titolo della conversazione email..."
          className="w-full text-xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 bg-transparent"
        />
      </section>

      <div className="flex flex-col gap-6 w-full">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" /> Contesto
            </div>
            <button
              type="button"
              onClick={() => onPaste('context')}
              className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 px-2 py-1 rounded shadow-sm"
            >
              Incolla
            </button>
          </div>
          <div className="p-4">
            <textarea
              value={draft.context}
              placeholder="Incolla qui il contesto della conversazione..."
              onChange={(e) => onUpdate({ context: e.target.value })}
              className="w-full h-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-lg text-slate-900 dark:text-white"
            />
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> La tua bozza
            </div>
            <button
              type="button"
              onClick={() => onPaste('draft')}
              className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 px-2 py-1 rounded shadow-sm"
            >
              Incolla
            </button>
          </div>
          <div className="p-4">
            <textarea
              value={draft.draft}
              onChange={(e) => onUpdate({ draft: e.target.value })}
              placeholder="Scrivi qui la tua bozza di email..."
              className="w-full h-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-lg text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-4 flex justify-center items-center w-full gap-4">
            <button
              type="button"
              onClick={onRefine}
              disabled={isLoading || !draft.draft}
              className=" bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isLoading ? 'Raffinando...' : 'Raffina Email'}
            </button>
          </div>
        </section>
      </div>

      {draft.result && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-blue-100 dark:border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-blue-900 dark:text-blue-300">
              Risultato Raffinato
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onContinueThread}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 px-3 py-1 rounded-md font-medium"
              >
                <History className="w-4 h-4" /> Continua Thread
              </button>
              <button
                type="button"
                onClick={onCopyResult}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 px-3 py-1 rounded-md font-medium"
              >
                <Copy className="w-4 h-4" /> Copia
              </button>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg whitespace-pre-wrap text-slate-800 dark:text-slate-200">
            {draft.result}
          </div>
        </section>
      )}
    </div>
  </div>
);
