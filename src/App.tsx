import { useState } from 'react';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { EmailEditor } from './components/EmailEditor';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { SidebarControls } from './components/SidebarControls';
import { ThreadModal } from './components/ThreadModal';
import { useAppHooks } from './hooks/useAppHooks';
import { useEmailLogic } from './hooks/useEmailLogic';

export default function App() {
  const { drafts, updateDraft, createDraft, deleteDraft, loading } = useAppHooks();
  const [activeId, setActiveId] = useState<string>(drafts[0]?.id || '1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [provider, setProvider] = useState(localStorage.getItem('sentai_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(localStorage.getItem('sentai_api_key') || '');
  const [modelName, setModelName] = useState(
    localStorage.getItem('sentai_model') || 'gemini-2.0-flash'
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [threadModalOpen, setThreadModalOpen] = useState(false);
  const [clientReply, setClientReply] = useState('');

  const activeDraft = drafts.find((d) => d.id === activeId) ||
    drafts[0] || {
      id: 'placeholder',
      title: '',
      context: '',
      draft: '',
      result: '',
      persona: 'dev',
      tone: 'professional',
      detail: 'balanced',
      updatedAt: Date.now(),
    };

  const { isLoading, handleRefine, copyToClipboard, pasteFromClipboard } = useEmailLogic(
    activeDraft,
    (updates) => updateDraft(activeId, updates),
    setIsSettingsOpen
  );

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Caricamento...</div>;
  }

  if (!drafts.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <button
          type="button"
          onClick={() => setActiveId(createDraft())}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crea prima bozza
        </button>
      </div>
    );
  }

  const saveSettings = () => {
    localStorage.setItem('sentai_provider', provider);
    localStorage.setItem('sentai_api_key', apiKey);
    localStorage.setItem('sentai_model', modelName);
    setIsSettingsOpen(false);
  };

  const handleContinueThread = () => {
    const timestamp = new Date().toLocaleString();
    const newContext = `${activeDraft.context}\n\n[Email Precedente (AI)]:\n${activeDraft.result}\n\n[Risposta Cliente - ${timestamp}]:\n${clientReply}`;
    updateDraft(activeId, { context: newContext, draft: '', result: '' });
    setClientReply('');
    setThreadModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar
        drafts={drafts}
        activeId={activeId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        setActiveId={setActiveId}
        createDraft={() => setActiveId(createDraft())}
        onDelete={setDeleteConfirmation}
        updateDraft={updateDraft}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <div className="w-full flex lg:flex-row flex-col lg:justify-center justify-start overflow-y-auto">
          <EmailEditor
            draft={activeDraft}
            isLoading={isLoading}
            onUpdate={(u) => updateDraft(activeId, u)}
            onRefine={handleRefine}
            onPaste={pasteFromClipboard}
            onContinueThread={() => setThreadModalOpen(true)}
            onCopyResult={copyToClipboard}
          />
          <SidebarControls draft={activeDraft} onUpdate={(u) => updateDraft(activeId, u)} />
        </div>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        modelName={modelName}
        setModelName={setModelName}
        onSave={saveSettings}
        setProvider={setProvider}
        provider={provider}
      />
      <DeleteConfirmationModal
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          if (deleteConfirmation) {
            deleteDraft(deleteConfirmation);
            if (activeId === deleteConfirmation)
              setActiveId(drafts.find((d) => d.id !== deleteConfirmation)?.id || '');
            setDeleteConfirmation(null);
          }
        }}
      />
      <ThreadModal
        isOpen={threadModalOpen}
        onClose={() => setThreadModalOpen(false)}
        onConfirm={handleContinueThread}
        value={clientReply}
        onChange={setClientReply}
      />
    </div>
  );
}
