import { Mail, MenuIcon, Moon, Settings, Sun } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onOpenSettings: () => void;
}

export const Header = ({ isSidebarOpen, toggleSidebar, onOpenSettings }: HeaderProps) => {
  const { isDark, toggleTheme } = useDarkMode(); // Hook per gestire il tema scuro
  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer lg:hidden"
          type="button"
          onClick={toggleSidebar}
        >
          <MenuIcon
            className={`w-5 h-5 ${isSidebarOpen ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}
          />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Mail className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block text-slate-900 dark:text-white">
            SentAI
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
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
        <button
          className="cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          type="button"
          onClick={onOpenSettings}
        >
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </header>
  );
};
