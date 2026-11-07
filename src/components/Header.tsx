import { Bug, Mail, MenuIcon, Moon, Settings, Sun } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface HeaderProps {
  isSidebarOpen?: boolean;
  // Senza queste funzioni, come nella schermata iniziale, il pulsante corrispondente non viene mostrato.
  toggleSidebar?: () => void;
  onOpenSettings?: () => void;
}

const VITE_RELEASE = import.meta.env.VITE_RELEASE ?? '';
const VITE_DATA_RELEASE = import.meta.env.VITE_DATA_RELEASE ?? '';
const version = [VITE_RELEASE, VITE_DATA_RELEASE].join(' - ');

// Link provvisorio: sostituire con l'URL reale del canale di segnalazione.
const FEEDBACK_URL = 'https://forms.gle/heqSqwCUXTWwRaBu7';

export const Header = ({ isSidebarOpen = false, toggleSidebar, onOpenSettings }: HeaderProps) => {
  const { isDark, toggleTheme } = useDarkMode(); // Hook per gestire il tema scuro
  return (
    <header className="h-16 px-3 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0 relative z-50">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {toggleSidebar && (
          <button
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer lg:hidden"
            type="button"
            onClick={toggleSidebar}
          >
            <MenuIcon
              className={`w-5 h-5 ${isSidebarOpen ? 'text-primary-600' : 'text-slate-600 dark:text-slate-400'}`}
            />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="bg-primary-600 p-1.5 rounded-lg">
            <Mail className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block text-slate-900 dark:text-white">
            SentAI {version === ' - ' ? '' : `(${version})`}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Segnala un bug o lascia un feedback"
          aria-label="Segnala un bug o lascia un feedback"
          className="cursor-pointer flex items-center gap-1.5 p-2 sm:px-3 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <Bug className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">Feedback</span>
        </a>
        <button
          className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          type="button"
          onClick={toggleTheme}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
        </button>
        {onOpenSettings && (
          <button
            className="cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
            type="button"
            onClick={onOpenSettings}
          >
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
      </div>
    </header>
  );
};
