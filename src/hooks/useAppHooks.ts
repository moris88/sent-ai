import type { EmailDraft } from '../types';
import { useDarkMode } from './useDarkMode';
import { useDrafts } from './useDrafts';
import { useStorage } from './useStorage';

export const useAppHooks = () => {
  const isDesktop = import.meta.env.VITE_APP === 'desktop';

  // Hooks per desktop
  const storage = useStorage<EmailDraft[]>('sentai_drafts', []); // Need to match initial structure from useDrafts

  // Hooks per web
  const draftsHook = useDrafts();
  const darkMode = useDarkMode();

  if (isDesktop) {
    const [drafts, setDrafts, loading] = storage;

    // Adatta lo storage hook per conformarsi all'interfaccia usata in App.tsx
    const updateDraft = (id: string, updates: Partial<EmailDraft>) => {
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d))
      );
    };

    const createDraft = () => {
      const newDraft: EmailDraft = {
        id: crypto.randomUUID(),
        title: '',
        context: '',
        draft: '',
        result: '',
        persona: 'dev',
        tone: 'professional',
        detail: 'balanced',
        language: 'it',
        structure: 'paragraphs',
        temperature: 0.7,
        keywords: '',
        generateSubject: false,
        updatedAt: Date.now(),
      };
      setDrafts([...drafts, newDraft]);
      return newDraft.id;
    };

    const deleteDraft = (id: string) => {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    };

    return {
      drafts,
      updateDraft,
      createDraft,
      deleteDraft,
      loading,
      isDark: false, // Default per desktop
      toggleTheme: () => {},
    };
  }

  return {
    drafts: draftsHook.drafts,
    updateDraft: draftsHook.updateDraft,
    createDraft: draftsHook.createDraft,
    deleteDraft: draftsHook.deleteDraft,
    loading: false,
    isDark: darkMode.isDark,
    toggleTheme: darkMode.toggleTheme,
  };
};
