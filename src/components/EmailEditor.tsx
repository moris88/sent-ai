import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  History,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { generateTitle } from '../services/ai';
import type { EmailDraft } from '../types';
import { extractTextFromPDF } from '../utils/pdf';

interface EditorProps {
  draft: EmailDraft;
  isLoading: boolean;
  onUpdate: (updates: Partial<EmailDraft>) => void;
  onRefine: () => void;
  onPaste: (target: 'context' | 'draft') => void;
  onContinueThread: () => void;
  onCopyResult: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
  checkApiKey: () => boolean;
}

export const EmailEditor = ({
  draft,
  isLoading,
  onUpdate,
  onRefine,
  onPaste,
  onContinueThread,
  onCopyResult,
  onDiscard,
  onRegenerate,
  checkApiKey,
}: EditorProps) => {
  const resultSectionRef = useRef<HTMLOptionElement>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (draft.result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [draft.result]);

  const handleGenerateTitle = async () => {
    if (!checkApiKey()) return;
    setIsGeneratingTitle(true);
    try {
      const apiKey = localStorage.getItem('sentai_api_key');
      const provider = localStorage.getItem('sentai_provider') as any;
      const model = localStorage.getItem('sentai_model');

      if (!apiKey || !provider || !model) {
        setIsGeneratingTitle(false);
        return;
      }

      const title = await generateTitle(draft.context, draft.draft, provider, apiKey, model);
      onUpdate({ title });
    } catch (error) {
      console.error('Error generating title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const text = await extractTextFromPDF(file);
        onUpdate({
          context: draft.context
            ? `${draft.context}\n\n[PDF: ${file.name}]\n${text}`
            : `[PDF: ${file.name}]\n${text}`,
        });
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
        alert('Impossibile estrarre il testo dal PDF.');
      }
    }
  };

  const classNameButton =
    'cursor-pointer text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 px-2 py-1 rounded shadow-sm flex items-center gap-1';

  return (
    <div className="flex-1 md:p-4 p-1 w-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 w-full pb-8">
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-2">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Titolo della conversazione email..."
            className="flex-1 text-xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 bg-transparent"
          />
          <button
            type="button"
            className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 transition-colors"
            onClick={handleGenerateTitle}
            disabled={isGeneratingTitle}
            title="Genera titolo con AI"
          >
            {isGeneratingTitle ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
          </button>
        </section>

        <div className="flex flex-col gap-6 w-full">
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setIsContextOpen(!isContextOpen)}
                className="cursor-pointer flex items-center gap-2 hover:text-blue-600 transition-colors"
                title={isContextOpen ? 'Chiudi Contesto' : 'Apri Contesto'}
              >
                {isContextOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <History className="w-4 h-4 text-blue-600" /> Contesto
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={classNameButton}
                  title="Incolla da PDF"
                >
                  <FileText className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => onPaste('context')}
                  className={classNameButton}
                  title="Incolla da appunti"
                >
                  <Upload className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ context: '' })}
                  disabled={!draft.context}
                  className={classNameButton}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {isContextOpen && (
              <div className="p-4">
                <textarea
                  value={draft.context}
                  placeholder="Incolla qui il contesto della conversazione o carica un PDF..."
                  onChange={(e) => onUpdate({ context: e.target.value })}
                  className="w-full h-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-lg text-slate-900 dark:text-white"
                />
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> La tua bozza
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cursor-pointer flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-600"
                  onClick={onContinueThread}
                  title="Aggiungi al contesto la bozza e continua il thread"
                >
                  <History className="w-3 h-3" />
                  <span className="hidden md:inline">Continua Thread</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(draft.draft)}
                  disabled={!draft.draft}
                  className={classNameButton}
                  title="Copia la bozza negli appunti"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onPaste('draft')}
                  className={classNameButton}
                  title="Incolla da appunti"
                >
                  <Upload className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ draft: '' })}
                  disabled={!draft.draft}
                  className={classNameButton}
                  title="Svuota la bozza"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={draft.draft}
                onChange={(e) => onUpdate({ draft: e.target.value })}
                placeholder="Scrivi qui la tua bozza di email, poi clicca su 'Raffina Email' e lascia fare all'AI."
                className="w-full h-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 flex justify-center items-center w-full gap-4">
              <button
                type="button"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
                onClick={onRefine}
                disabled={isLoading || !draft.draft}
                title="Raffina la bozza con l'AI"
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

        {(draft.result || isLoading) && (
          <section
            ref={resultSectionRef}
            className="bg-blue-50 dark:bg-blue-950/30 rounded-xl shadow-sm border-2 border-blue-500 dark:border-blue-600 p-6 space-y-4 animate-in fade-in zoom-in duration-300"
          >
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-7 w-48 bg-blue-200 dark:bg-blue-800 rounded"></div>
                <div className="h-40 bg-white/50 dark:bg-slate-900/50 rounded-lg"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-bold md:text-lg text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Risultato Raffinato
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onDiscard}
                      className="cursor-pointer flex items-center justify-center gap-2 text-sm text-red-700 dark:text-red-300 bg-white/50 dark:bg-red-900/50 hover:bg-white dark:hover:bg-red-800 p-2 custom-lg:px-3 custom-lg:py-1.5 rounded-md font-medium border border-red-200 dark:border-red-700 transition-colors"
                      title="Scarta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="cursor-pointer flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-blue-900/50 hover:bg-white dark:hover:bg-blue-800 p-2 custom-lg:px-3 custom-lg:py-1.5 rounded-md font-medium border border-blue-200 dark:border-blue-700 transition-colors"
                      title="Rigenera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ draft: draft.result })}
                      className="cursor-pointer flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-blue-900/50 hover:bg-white dark:hover:bg-blue-800 p-2 custom-lg:px-3 custom-lg:py-1.5 rounded-md font-medium border border-blue-200 dark:border-blue-700 transition-colors"
                      title="Aggiorna Bozza"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onCopyResult}
                      className="cursor-pointer flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-blue-900/50 hover:bg-white dark:hover:bg-blue-800 p-2 custom-lg:px-3 custom-lg:py-1.5 rounded-md font-medium border border-blue-200 dark:border-blue-700 transition-colors"
                      title="Copia"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg whitespace-pre-wrap text-slate-800 dark:text-slate-200 shadow-inner">
                  {draft.result}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
