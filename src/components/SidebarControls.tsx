import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { EmailDraft } from '../types';
import { DETAIL_LEVELS, LANGUAGES, PERSONAS, TONES } from '../types';

interface ControlsProps {
  isOpen: boolean;
  draft: EmailDraft;
  onUpdate: (updates: Partial<EmailDraft>) => void;
}

export const SidebarControls = ({ isOpen, draft, onUpdate }: ControlsProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <aside
      className={`${
        isOpen
          ? 'fixed inset-y-0 right-0 z-40 bg-white dark:bg-slate-900 w-full md:w-80 h-full border-l border-slate-200 dark:border-slate-700'
          : 'fixed inset-y-0 right-0 z-40 w-0 h-full'
      } bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col overflow-hidden xl:relative xl:w-80 xl:border-l xl:border-slate-200 xl:dark:border-slate-700`}
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700">
        <Bot className="w-5 h-5 text-blue-600" /> Controlli AI
      </h2>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-[320px]">
        <section className="space-y-6">
          <div>
            <label
              htmlFor="persona"
              className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider"
            >
              Persona
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PERSONAS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    onUpdate({ persona: p.id });
                  }}
                  className={`cursor-pointer flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    draft.persona === p.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-600 text-slate-600 dark:text-slate-400'
                  }`}
                  title={p.description}
                >
                  <span className="text-xl">{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="tone"
              className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider"
            >
              Tono
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => onUpdate({ tone: t.id })}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                    draft.tone === t.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                  title={t.description}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Advanced Settings */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="cursor-pointer w-full flex items-center justify-between text-sm font-bold dark:text-slate-300 uppercase tracking-wider bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 transition-colors"
            >
              Impostazioni Avanzate
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="language"
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Lingua
                  </label>
                  <select
                    id="language"
                    value={draft.language}
                    onChange={(e) => onUpdate({ language: e.target.value })}
                    className="cursor-pointer w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="details"
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Dettaglio
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-600 p-1 rounded-lg gap-1">
                    {DETAIL_LEVELS.map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => onUpdate({ detail: d.id })}
                        className={`cursor-pointer flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                          draft.detail === d.id
                            ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-blue-600 dark:text-slate-300 hover:bg-white dark:hover:bg-gray-800'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="temperature"
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Creatività (Temperature: {draft.temperature})
                  </label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={draft.temperature}
                    onChange={(e) => onUpdate({ temperature: Number.parseFloat(e.target.value) })}
                    className="cursor-pointer w-full accent-blue-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="keywords"
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Parole Chiave
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    value={draft.keywords}
                    onChange={(e) => onUpdate({ keywords: e.target.value })}
                    placeholder="Es: urgente, follow-up, meeting"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white ring-blue-600 focus:ring-1 focus:outline-none"
                  />
                </div>
                <label
                  htmlFor="generate-subject"
                  className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <input
                    id="generate-subject"
                    type="checkbox"
                    checked={draft.generateSubject}
                    onChange={(e) => onUpdate({ generateSubject: e.target.checked })}
                    className="cursor-pointer accent-blue-700"
                  />
                  Genera Oggetto Email
                </label>
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};
