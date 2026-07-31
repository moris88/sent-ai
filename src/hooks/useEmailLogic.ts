import { useState } from 'react';
import { refineEmail } from '../services/ai';
import type { EmailDraft } from '../types';

export const useEmailLogic = (
  activeDraft: EmailDraft,
  updateActiveDraft: (updates: Partial<EmailDraft>) => void,
  setIsSettingsOpen: (open: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefine = async () => {
    if (!activeDraft.draft) return;
    setIsLoading(true);
    try {
      const provider = (localStorage.getItem('sentai_provider') as any) || 'gemini';
      const apiKey = localStorage.getItem('sentai_api_key') || '';
      const model = localStorage.getItem('sentai_model') || '';
      const prompt = localStorage.getItem('sentai_additional_prompt') || '';

      const refinedText = await refineEmail({
        ...activeDraft,
        provider,
        apiKey,
        model,
        prompt,
      });
      updateActiveDraft({ result: refinedText });
    } catch (error: any) {
      console.error('Error refining email:', error);
      alert(error.message || "Errore durante la generazione dell'email.");
      if (error.message.includes('Key non trovata')) {
        setIsSettingsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeDraft.result);
    alert('Email copiata negli appunti!');
  };

  const pasteFromClipboard = async (target: 'context' | 'draft') => {
    try {
      const text = await navigator.clipboard.readText();
      if (target === 'context') {
        updateActiveDraft({
          context: activeDraft.context ? `${activeDraft.context}\n${text}` : text,
        });
      } else {
        updateActiveDraft({ draft: activeDraft.draft ? `${activeDraft.draft}\n${text}` : text });
      }
    } catch (error) {
      console.error('Error accessing clipboard:', error);
      alert('Impossibile accedere agli appunti. Verifica i permessi del browser.');
    }
  };

  return { isLoading, handleRefine, copyToClipboard, pasteFromClipboard };
};
