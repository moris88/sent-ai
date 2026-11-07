import { Bold, Eye, EyeOff, Heading2, Italic, Link2, List, ListOrdered, Undo2 } from 'lucide-react';
import type { RefObject } from 'react';
import { useState } from 'react';
import { MarkdownContent } from './MarkdownContent';

type FormatKind = 'bold' | 'italic' | 'heading' | 'bullet' | 'numbered' | 'link';

const FORMATS: Record<
  FormatKind,
  { before: string; after?: string; placeholder: string; perLine?: boolean }
> = {
  bold: { before: '**', after: '**', placeholder: 'testo in grassetto' },
  italic: { before: '*', after: '*', placeholder: 'testo in corsivo' },
  heading: { before: '## ', placeholder: 'titolo', perLine: true },
  bullet: { before: '- ', placeholder: 'elemento', perLine: true },
  numbered: { before: '1. ', placeholder: 'elemento', perLine: true },
  link: { before: '[', after: '](https://)', placeholder: 'testo del link' },
};

const TOOLBAR: { kind: FormatKind; label: string; icon: typeof Bold }[] = [
  { kind: 'bold', label: 'Grassetto', icon: Bold },
  { kind: 'italic', label: 'Corsivo', icon: Italic },
  { kind: 'heading', label: 'Titolo', icon: Heading2 },
  { kind: 'bullet', label: 'Elenco puntato', icon: List },
  { kind: 'numbered', label: 'Elenco numerato', icon: ListOrdered },
  { kind: 'link', label: 'Link', icon: Link2 },
];

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const MarkdownEditor = ({
  value,
  onChange,
  disabled = false,
  placeholder,
  textareaRef,
  onUndo,
  canUndo = false,
}: MarkdownEditorProps) => {
  const [isPreview, setIsPreview] = useState(false);

  const applyFormat = (kind: FormatKind) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const format = FORMATS[kind];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || format.placeholder;

    let replacement: string;
    if (format.perLine) {
      replacement = selected
        .split('\n')
        .map((line, index) =>
          kind === 'numbered' ? `${index + 1}. ${line}` : `${format.before}${line}`
        )
        .join('\n');
    } else {
      replacement = `${format.before}${selected}${format.after ?? ''}`;
    }

    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);

    const selectionStart = start + format.before.length;
    const selectionEnd = selectionStart + selected.length;
    requestAnimationFrame(() => {
      textarea.focus();
      if (!format.perLine) textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  return (
    <div className="p-3 md:p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="toolbar" aria-label="Formattazione Markdown" className="flex flex-wrap gap-1">
          {TOOLBAR.map(({ kind, label, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => applyFormat(kind)}
              disabled={disabled || isPreview}
              className="cursor-pointer p-2 rounded-md text-slate-600 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-primary-900/40 dark:hover:text-primary-300"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo || disabled}
              title="Annulla l'ultima modifica"
              aria-label="Annulla l'ultima modifica"
              className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Annulla
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPreview((prev) => !prev)}
            aria-pressed={isPreview}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isPreview ? 'Modifica' : 'Anteprima'}
          </button>
        </div>
      </div>

      {isPreview ? (
        <div className="min-h-56 md:min-h-64 p-3 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base md:text-lg">
          {value.trim() ? (
            <MarkdownContent>{value}</MarkdownContent>
          ) : (
            <p className="text-slate-400">Nessun contenuto da mostrare.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-56 md:h-64 p-3 md:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y text-base md:text-lg text-slate-900 dark:text-white"
        />
      )}
    </div>
  );
};
