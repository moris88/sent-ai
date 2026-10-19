import { Download, X } from 'lucide-react';
import { useState } from 'react';

const STORAGE_KEY = 'sentai_desktop_toast_dismissed';

export const DesktopAppToast = () => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  if (import.meta.env.VITE_APP === 'desktop' || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignora: il toast resta chiuso per questa sessione
    }
  };

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-20 sm:right-auto sm:max-w-sm z-45 flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="bg-blue-600 p-2 rounded-lg shrink-0">
        <Download className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Disponibile la versione desktop
        </p>
        <a
          href="https://github.com/moris88/sent-ai/releases"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Scarica
        </a>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="cursor-pointer p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 shrink-0"
        title="Chiudi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
