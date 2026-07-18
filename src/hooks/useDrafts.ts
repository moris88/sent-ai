import { useEffect, useState } from 'react';
import type { EmailDraft } from '../types';

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<EmailDraft[]>(() => {
    const saved = localStorage.getItem('sentai_drafts');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            title: '',
            context: '',
            draft: '',
            result: '',
            persona: 'dev',
            tone: 'professional',
            detail: 'balanced',
            updatedAt: Date.now(),
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('sentai_drafts', JSON.stringify(drafts));
  }, [drafts]);

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
    setDrafts([newDraft, ...drafts]);
    return newDraft.id;
  };

  const deleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return { drafts, setDrafts, updateDraft, createDraft, deleteDraft };
};
