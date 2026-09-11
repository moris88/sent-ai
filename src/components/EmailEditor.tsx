import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Copy,
  Edit3,
  FileText,
  History,
  LayoutTemplate,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { generateTitle } from '../services/ai';
import type { EmailDraft } from '../types';
import { extractTextFromPDF } from '../utils/pdf';

type Snippet = { id: string; label: string; text: string };

const normalizeRecipients = (value: string) =>
  value
    .split(/[;,\s]+/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);

const DEFAULT_SNIPPETS: Snippet[] = [
  { id: 'greeting', label: 'Saluto', text: 'Buongiorno,\n\n' },
  { id: 'thanks', label: 'Ringraziamento', text: 'Grazie per la tua risposta.\n\n' },
  { id: 'follow-up', label: 'Attesa riscontro', text: 'Resto in attesa di un tuo riscontro.\n\n' },
  { id: 'closing', label: 'Chiusura', text: 'Cordiali saluti,\n' },
];

interface EditorProps {
  draft: EmailDraft;
  isLoading: boolean;
  isGeneratingSubject: boolean;
  isModifying: boolean;
  onUpdate: (updates: Partial<EmailDraft>) => void;
  onRefine: () => void;
  onPaste: (target: 'context' | 'draft') => void;
  onContinueThread: () => void;
  onCopyResult: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
  onGenerateSubject: () => void;
  onCopySubject: () => void;
  onModifyResult: (instructions: string) => void;
  checkApiKey: () => boolean;
}

export const EmailEditor = ({
  draft,
  isLoading,
  isGeneratingSubject,
  isModifying,
  onUpdate,
  onRefine,
  onPaste,
  onContinueThread,
  onCopyResult,
  onDiscard,
  onRegenerate,
  onGenerateSubject,
  onCopySubject,
  onModifyResult,
  checkApiKey,
}: EditorProps) => {
  const resultSectionRef = useRef<HTMLOptionElement>(null);
  const modifyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isModifyFormOpen, setIsModifyFormOpen] = useState(false);
  const [modifyInstructions, setModifyInstructions] = useState('');
  const wasModifyingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftFileInputRef = useRef<HTMLInputElement>(null);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [templateClientName, setTemplateClientName] = useState('');
  const [templateSenderName, setTemplateSenderName] = useState(
    () => localStorage.getItem('sentai_sender_name') || ''
  );
  const draftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [customSnippets, setCustomSnippets] = useState<Snippet[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sentai_custom_snippets') || '[]');
    } catch {
      return [];
    }
  });
  const [isSnippetFormOpen, setIsSnippetFormOpen] = useState(false);
  const [newSnippetLabel, setNewSnippetLabel] = useState('');
  const [newSnippetText, setNewSnippetText] = useState('');
  const [isSendFormOpen, setIsSendFormOpen] = useState(false);
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');

  const insertSnippetAtCursor = (text: string) => {
    const textarea = draftTextareaRef.current;
    const start = textarea?.selectionStart ?? draft.draft.length;
    const end = textarea?.selectionEnd ?? draft.draft.length;
    const newValue = draft.draft.slice(0, start) + text + draft.draft.slice(end);
    onUpdate({ draft: newValue });
    requestAnimationFrame(() => {
      if (textarea) {
        const cursorPos = start + text.length;
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    });
  };

  const handleAddCustomSnippet = () => {
    if (!newSnippetLabel.trim() || !newSnippetText.trim()) return;
    const updated = [
      ...customSnippets,
      { id: crypto.randomUUID(), label: newSnippetLabel.trim(), text: newSnippetText },
    ];
    setCustomSnippets(updated);
    localStorage.setItem('sentai_custom_snippets', JSON.stringify(updated));
    setNewSnippetLabel('');
    setNewSnippetText('');
    setIsSnippetFormOpen(false);
  };

  const handleDeleteCustomSnippet = (id: string) => {
    const updated = customSnippets.filter((s) => s.id !== id);
    setCustomSnippets(updated);
    localStorage.setItem('sentai_custom_snippets', JSON.stringify(updated));
  };

  const addRecipients = (
    value: string,
    current: string[],
    update: (recipients: string[]) => void
  ) => {
    const recipients = normalizeRecipients(value).filter(
      (recipient) => !current.includes(recipient)
    );
    if (recipients.length > 0) update([...current, ...recipients]);
  };

  const handleRecipientKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    current: string[],
    update: (recipients: string[]) => void,
    clear: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      addRecipients(value, current, update);
      clear();
    }
  };

  const handleSendEmail = () => {
    const pendingTo = normalizeRecipients(toInput);
    const pendingCc = normalizeRecipients(ccInput);
    const allTo = [...toRecipients, ...pendingTo.filter((recipient) => !toRecipients.includes(recipient))];
    const allCc = [...ccRecipients, ...pendingCc.filter((recipient) => !ccRecipients.includes(recipient))];

    const params = new URLSearchParams({
      subject: draft.subject,
      body: draft.result,
    });
    if (allCc.length > 0) params.set('cc', allCc.join(','));
    window.location.href = `mailto:${allTo.join(',')}?${params.toString()}`;
    setIsSendFormOpen(false);
  };

  useEffect(() => {
    console.debug('[EmailEditor] Risultato Raffinato:', {
      isLoading,
      isModifying,
      isGeneratingSubject,
      resultLength: draft.result?.length ?? 0,
      resultPreview: draft.result?.slice(0, 200),
      willRenderSection: Boolean(draft.result || isLoading),
    });
  }, [draft.result, isLoading, isModifying, isGeneratingSubject]);

  useEffect(() => {
    if (draft.result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [draft.result]);

  useEffect(() => {
    if (isModifyFormOpen && modifyTextareaRef.current) {
      modifyTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      modifyTextareaRef.current.focus();
    }
  }, [isModifyFormOpen]);

  useEffect(() => {
    if (wasModifyingRef.current && !isModifying) {
      setIsModifyFormOpen(false);
      setModifyInstructions('');
    }
    wasModifyingRef.current = isModifying;
  }, [isModifying]);

  useEffect(() => {
    setIsModifyFormOpen(false);
    setModifyInstructions('');
    setIsTemplateFormOpen(false);
    setTemplateClientName('');
  }, [draft.id]);

  const handleInsertTemplate = () => {
    const clientName = templateClientName.trim() || '[nome Cliente]';
    const senderName = templateSenderName.trim() || '[mio nome]';
    const body = draft.draft || '[testo]';
    onUpdate({ draft: `Ciao ${clientName}\n\n${body}\n\nBuona giornata,\n${senderName}` });
    localStorage.setItem('sentai_sender_name', senderName === '[mio nome]' ? '' : senderName);
    setIsTemplateFormOpen(false);
    setTemplateClientName('');
  };

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

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'context' | 'draft'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let text = '';
      let label = '';

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
        label = `[PDF: ${file.name}]`;
      } else if (file.name.toLowerCase().endsWith('.md') || file.type === 'text/markdown') {
        text = await file.text();
        label = `[MD: ${file.name}]`;
      } else {
        alert('Formato file non supportato. Carica un file PDF o Markdown (.md).');
        return;
      }

      const current = draft[target];
      onUpdate({ [target]: current ? `${current}\n\n${label}\n${text}` : `${label}\n${text}` });
    } catch (error) {
      console.error('Error extracting text from file:', error);
      alert('Impossibile estrarre il testo dal file.');
    } finally {
      e.target.value = '';
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

        {draft.generateSubject && (
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> Oggetto Email
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGenerateSubject}
                  disabled={isGeneratingSubject}
                  className={classNameButton}
                  title="Genera oggetto con AI"
                >
                  {isGeneratingSubject ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onCopySubject}
                  disabled={!draft.subject}
                  className={classNameButton}
                  title="Copia l'oggetto negli appunti"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ subject: '' })}
                  disabled={!draft.subject}
                  className={classNameButton}
                  title="Elimina l'oggetto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => onUpdate({ subject: e.target.value })}
                placeholder="Oggetto dell'email..."
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg text-slate-900 dark:text-white"
              />
            </div>
          </section>
        )}

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
                  title="Incolla da PDF o Markdown"
                >
                  <FileText className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e, 'context')}
                  accept=".pdf,.md,text/markdown"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => onPaste('context')}
                  className={classNameButton}
                  title="Incolla da appunti"
                >
                  <ClipboardPaste className="w-3 h-3" />
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
                  onClick={() => navigator.clipboard.writeText(draft.draft)}
                  disabled={!draft.draft}
                  className={classNameButton}
                  title="Copia la bozza negli appunti"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => draftFileInputRef.current?.click()}
                  className={classNameButton}
                  title="Incolla da PDF o Markdown"
                >
                  <FileText className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  ref={draftFileInputRef}
                  onChange={(e) => handleFileChange(e, 'draft')}
                  accept=".pdf,.md,text/markdown"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => setIsTemplateFormOpen((prev) => !prev)}
                  className={classNameButton}
                  title="Inserisci header e footer"
                >
                  <LayoutTemplate className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onPaste('draft')}
                  className={classNameButton}
                  title="Incolla da appunti"
                >
                  <ClipboardPaste className="w-3 h-3" />
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
            {isTemplateFormOpen && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="template-client-name"
                      className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Nome Cliente
                    </label>
                    <input
                      id="template-client-name"
                      type="text"
                      value={templateClientName}
                      onChange={(e) => setTemplateClientName(e.target.value)}
                      placeholder="Es: Mario Rossi"
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="template-sender-name"
                      className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Il tuo nome
                    </label>
                    <input
                      id="template-sender-name"
                      type="text"
                      value={templateSenderName}
                      onChange={(e) => setTemplateSenderName(e.target.value)}
                      placeholder="Es: Maurizio"
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTemplateFormOpen(false);
                      setTemplateClientName('');
                    }}
                    className="cursor-pointer text-sm text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertTemplate}
                    className="cursor-pointer flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md font-medium transition-colors"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    Inserisci
                  </button>
                </div>
              </div>
            )}
            <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
              {[...DEFAULT_SNIPPETS, ...customSnippets].map((snippet) => (
                <span key={snippet.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => insertSnippetAtCursor(snippet.text)}
                    className="cursor-pointer text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-l-full rounded-r-full border border-slate-200 dark:border-slate-600"
                    title={`Inserisci: "${snippet.text.trim()}"`}
                  >
                    {snippet.label}
                  </button>
                  {customSnippets.some((s) => s.id === snippet.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSnippet(snippet.id)}
                      className="cursor-pointer -ml-2 z-10 bg-slate-300 dark:bg-slate-600 hover:bg-red-200 dark:hover:bg-red-800 text-slate-600 dark:text-slate-200 rounded-full p-0.5"
                      title="Elimina frase"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setIsSnippetFormOpen((prev) => !prev)}
                className="cursor-pointer text-xs flex items-center gap-1 bg-white dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full"
                title="Aggiungi una frase personalizzata"
              >
                <Plus className="w-3 h-3" />
                Nuova frase
              </button>
            </div>
            {isSnippetFormOpen && (
              <div className="mx-4 mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                <input
                  type="text"
                  value={newSnippetLabel}
                  onChange={(e) => setNewSnippetLabel(e.target.value)}
                  placeholder="Nome breve (es: Preventivo in corso)"
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white"
                />
                <textarea
                  value={newSnippetText}
                  onChange={(e) => setNewSnippetText(e.target.value)}
                  placeholder="Testo da inserire nella bozza..."
                  className="w-full h-20 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSnippetFormOpen(false);
                      setNewSnippetLabel('');
                      setNewSnippetText('');
                    }}
                    className="cursor-pointer text-sm text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomSnippet}
                    disabled={!newSnippetLabel.trim() || !newSnippetText.trim()}
                    className="cursor-pointer flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-3 py-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Salva frase
                  </button>
                </div>
              </div>
            )}
            <div className="p-4">
              <textarea
                ref={draftTextareaRef}
                value={draft.draft}
                disabled={isLoading}
                onChange={(e) => onUpdate({ draft: e.target.value })}
                placeholder="Scrivi qui la tua bozza di email, poi clicca su 'Raffina Email' e lascia fare all'AI."
                className="w-full h-64 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 flex justify-center items-center w-full gap-3">
              <button
                type="button"
                className="cursor-pointer bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all border border-blue-200 dark:border-blue-700"
                onClick={onContinueThread}
                title="Aggiungi al contesto la bozza e continua il thread"
              >
                <History className="w-4 h-4" />
                Continua Thread
              </button>
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
              {draft.result && (
                <button
                  type="button"
                  className="cursor-pointer bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all border border-blue-200 dark:border-blue-700"
                  onClick={() => {
                    setIsSendFormOpen(true);
                  }}
                  title="Apri il client di posta con oggetto e testo precompilati"
                >
                  <Mail className="w-4 h-4" />
                  Invia Email
                </button>
              )}
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
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModifyFormOpen((prev) => !prev)}
                    className="cursor-pointer flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 font-semibold px-4 py-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-700"
                    title="Modifica o sostituisci la bozza dell'AI"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifica Bozza
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ draft: draft.result })}
                    className="cursor-pointer flex items-center justify-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 font-bold px-4 py-2 rounded-lg transition-colors"
                    title="Sostituisci la tua bozza con la bozza dell'AI!"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approva Bozza
                  </button>
                </div>
                {isModifyFormOpen && (
                  <div className="p-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                    <textarea
                      ref={modifyTextareaRef}
                      value={modifyInstructions}
                      onChange={(e) => setModifyInstructions(e.target.value)}
                      placeholder="Descrivi la modifica da applicare al testo (es: 'rendilo più breve', 'aggiungi un saluto finale'...)"
                      disabled={isModifying}
                      className="w-full h-24 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm text-slate-900 dark:text-white disabled:opacity-60"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModifyFormOpen(false);
                          setModifyInstructions('');
                        }}
                        disabled={isModifying}
                        className="cursor-pointer text-sm text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!checkApiKey()) return;
                          onModifyResult(modifyInstructions);
                        }}
                        disabled={isModifying || !modifyInstructions.trim()}
                        className="cursor-pointer flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-3 py-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        {isModifying ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {isModifying ? 'Modifico...' : 'Applica Modifica'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {isSendFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSendFormOpen(false);
          }}
        >
          <form
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSendEmail();
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invia Email</h2>
              <button
                type="button"
                onClick={() => setIsSendFormOpen(false)}
                className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Inserisci gli indirizzi qui, oppure lasciali vuoti e aggiungili direttamente nel client di posta che si aprirà.
            </p>

            <div className="space-y-1">
              <label htmlFor="email-to" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                A <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 min-h-11 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                {toRecipients.map((recipient) => (
                  <span key={recipient} className="flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900/50 px-2 py-1 text-sm text-blue-800 dark:text-blue-200">
                    {recipient}
                    <button
                      type="button"
                      onClick={() => setToRecipients(toRecipients.filter((item) => item !== recipient))}
                      className="cursor-pointer text-blue-500 hover:text-blue-800 dark:hover:text-blue-100"
                      title={`Rimuovi ${recipient}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="email-to"
                  type="text"
                  value={toInput}
                  onChange={(event) => setToInput(event.target.value)}
                  onKeyDown={(event) => handleRecipientKeyDown(event, toInput, toRecipients, setToRecipients, () => setToInput(''))}
                  placeholder={toRecipients.length === 0 ? 'email@esempio.it (Invio per aggiungere)' : 'Aggiungi destinatario'}
                  className="min-w-48 flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="email-cc" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">CC</label>
              <div className="flex flex-wrap items-center gap-2 min-h-11 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                {ccRecipients.map((recipient) => (
                  <span key={recipient} className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 text-sm text-slate-700 dark:text-slate-200">
                    {recipient}
                    <button
                      type="button"
                      onClick={() => setCcRecipients(ccRecipients.filter((item) => item !== recipient))}
                      className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      title={`Rimuovi ${recipient}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="email-cc"
                  type="text"
                  value={ccInput}
                  onChange={(event) => setCcInput(event.target.value)}
                  onKeyDown={(event) => handleRecipientKeyDown(event, ccInput, ccRecipients, setCcRecipients, () => setCcInput(''))}
                  placeholder={ccRecipients.length === 0 ? 'Aggiungi destinatari in copia' : 'Aggiungi destinatario'}
                  className="min-w-48 flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Oggetto</p>
                <div className="mt-1 rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{draft.subject || 'Nessun oggetto'}</div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Contenuto</p>
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{draft.result || 'Nessun contenuto'}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSendFormOpen(false)}
                className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Apri client email
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
