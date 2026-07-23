import { ChevronDown, History, Plus, Trash2 } from 'lucide-react';
import type { EmailDraft } from '../types';

interface SidebarProps {
  drafts: EmailDraft[];
  activeId: string;
  isOpen: boolean;
  onClose: () => void;
  setActiveId: (id: string) => void;
  createDraft: () => void;
  onDelete: (id: string) => void;
  updateDraft: (id: string, updates: Partial<EmailDraft>) => void;
}

export const Sidebar = ({
  drafts,
  activeId,
  isOpen,
  onClose,
  setActiveId,
  createDraft,
  onDelete,
  updateDraft,
}: SidebarProps) => (
  <aside
    className={`${
      isOpen ? 'fixed inset-0 z-40 bg-white dark:bg-slate-900 w-full h-full' : 'w-0'
    } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden md:relative md:w-80`}
  >
    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between min-w-[320px]">
      <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
        <History className="w-4 h-4" /> Le tue email
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-2 text-slate-700 dark:text-slate-300"
        >
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>
        <button
          type="button"
          onClick={createDraft}
          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto min-w-[320px]">
      {drafts.map((d) => (
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
            <input
              className={`bg-transparent font-semibold outline-none w-full ${activeId === d.id ? 'text-blue-900 dark:text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
              value={d.title || d.id}
              onChange={(e) => updateDraft(d.id, { title: e.target.value })}
              onClick={(e) => activeId === d.id && e.stopPropagation()}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(d.id);
              }}
              className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-all"
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
      ))}
    </div>
  </aside>
);
