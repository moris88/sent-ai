import { useEffect, useRef, useState } from 'react';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { EmailEditor } from './components/EmailEditor';
import { Header } from './components/Header';
import LocalStorageLimitModal from './components/LocalStorageLimitModal';
import OldDraftsCleanupModal from './components/OldDraftsCleanupModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { SidebarControls } from './components/SidebarControls';
import { ThreadModal } from './components/ThreadModal';
import { useAppHooks } from './hooks/useAppHooks';
import { useEmailLogic } from './hooks/useEmailLogic';
import type { EmailDraft } from './types';
import { getLocalStorageSize, isLocalStorageApproachingLimit } from './utils/storage';
import { WrenchIcon } from 'lucide-react';

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
  const [additionalPrompt, setAdditionalPrompt] = useState(
    localStorage.getItem('sentai_additional_prompt') || ''
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [threadModalOpen, setThreadModalOpen] = useState(false);
  const [clientReply, setClientReply] = useState('');

  // Web-only storage management
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showSidebarControls, setShowSidebarControls] = useState(false);
  const [expiredDrafts, setExpiredDrafts] = useState<EmailDraft[]>([]);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    if (initialCheckDone.current || import.meta.env.VITE_APP === 'desktop' || !drafts.length)
      return;
    initialCheckDone.current = true;

    // Check old drafts
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const expired = drafts.filter((d) => d.updatedAt < oneWeekAgo);
    if (expired.length > 0) {
      setExpiredDrafts(expired);
      setShowCleanupModal(true);
    }

    // Check storage size (4MB threshold)
    if (isLocalStorageApproachingLimit(4 * 1024 * 1024)) {
      setShowStorageModal(true);
    }
  }, [drafts]);

  const handleConfirmCleanup = () => {
    for (const d of expiredDrafts) {
      deleteDraft(d.id);
    }
    setShowCleanupModal(false);
  };

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
      temperature: 0.5,
      keywords: '',
      generateSubject: false,
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
    localStorage.setItem('sentai_additional_prompt', additionalPrompt);
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
      <main className="flex-1 flex flex-col h-full relative">
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <button
          type="button"
          className="absolute top-20 right-6 cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold p-2 rounded-full flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
          onClick={() => setShowSidebarControls((prev) => !prev)}
          title="Mostra i controlli della sidebar"
        >
          <WrenchIcon className="w-5 h-5" />
        </button>
        {showSidebarControls &&(<SidebarControls draft={activeDraft} onUpdate={(u) => updateDraft(activeId, u)} onClose={() => setShowSidebarControls(false)}/>)}
        <EmailEditor
          draft={activeDraft}
          isLoading={isLoading}
          onUpdate={(u) => updateDraft(activeId, u)}
          onRefine={handleRefine}
          onPaste={pasteFromClipboard}
          onContinueThread={() => setThreadModalOpen(true)}
          onCopyResult={copyToClipboard}
          onDiscard={() => updateDraft(activeId, { result: '' })}
          onRegenerate={handleRefine}
        />
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
        additionalPrompt={additionalPrompt}
        setAdditionalPrompt={setAdditionalPrompt}
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
        onPaste={() => {
          navigator.clipboard.readText().then((text) => setClientReply(text));
        }}
      />
      <OldDraftsCleanupModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        onConfirm={handleConfirmCleanup}
        expiredCount={expiredDrafts.length}
      />
      <LocalStorageLimitModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        usagePercent={(getLocalStorageSize() / (5 * 1024 * 1024)) * 100}
      />
    </div>
  );
}
