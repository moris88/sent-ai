import { Bot, History, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { EmailDraft } from '../types';
import { AIChat } from './AIChat';

interface SidebarProps {
  drafts: EmailDraft[];
  activeId: string;
  isOpen: boolean;
  setActiveId: (id: string) => void;
  createDraft: () => void;
  onDelete: (id: string) => void;
  updateDraft: (id: string, updates: Partial<EmailDraft>) => void;
  checkApiKey: () => boolean;
  onAiError: (message: string) => void;
}

export const Sidebar = ({
  drafts,
  activeId,
  isOpen,
  setActiveId,
  createDraft,
  onDelete,
  updateDraft,
  checkApiKey,
  onAiError,
}: SidebarProps) => {
  const [view, setView] = useState<'drafts' | 'chat'>('drafts');

  return (
    <aside
      className={`${
        isOpen ? 'w-full' : 'w-0'
      } fixed top-16 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden lg:static lg:w-80 lg:shrink-0`}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between min-w-[280px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setView('drafts')}
            title="Le tue email"
          >
            <History
              className={`w-4 h-4 ${view === 'drafts' ? 'text-blue-600' : 'text-slate-500'}`}
            />
          </button>
          <button
            type="button"
            className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setView('chat')}
            title="Chat con AI"
          >
            <Bot className={`w-4 h-4 ${view === 'chat' ? 'text-blue-600' : 'text-slate-500'}`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {view === 'drafts' && (
            <button
              type="button"
              className="cursor-pointer text-white font-bold px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              onClick={createDraft}
              title="Crea Nuova Bozza"
            >
              <span className="hidden md:inline text-xs">Nuova Bozza Email</span>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto min-w-[280px]">
        {view === 'drafts' ? (
          drafts.map((d) => (
            <button
              type="button"
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors group ${
                activeId === d.id
                  ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-l-blue-600 dark:border-l-blue-600 text-blue-900 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="truncate w-full" title={d.title || d.id}>
                  <input
                    className={`bg-transparent font-semibold outline-none w-full truncate ${activeId === d.id ? 'text-blue-900 dark:text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
                    value={d.title || d.id}
                    onChange={(e) => updateDraft(d.id, { title: e.target.value })}
                    onClick={(e) => activeId === d.id && e.stopPropagation()}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(d.id);
                  }}
                  className="cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {d.draft ? 'È presente del contenuto' : 'Nessun contenuto...'}
              </p>
              <div className="text-[10px] text-slate-400 mt-2">
                {`${new Date(d.updatedAt).toLocaleDateString()} ${new Date(d.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </div>
            </button>
          ))
        ) : (
          <AIChat drafts={drafts} checkApiKey={checkApiKey} onAiError={onAiError} />
        )}
      </div>
    </aside>
  );
};
