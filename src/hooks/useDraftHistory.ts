import { useCallback, useRef, useState } from 'react';
import type { EmailDraft } from '../types';

type Snapshot = Pick<EmailDraft, 'draft' | 'result'>;

const MAX_HISTORY = 50;
// Digitazioni ravvicinate (entro questa finestra) formano un'unica voce di cronologia.
const TYPING_WINDOW_MS = 1000;

// Cronologia in memoria delle modifiche per bozza: serve a tornare indietro, anche dopo un'approvazione.
export const useDraftHistory = (
  drafts: EmailDraft[],
  updateDraft: (id: string, updates: Partial<EmailDraft>) => void
) => {
  const historyRef = useRef(new Map<string, Snapshot[]>());
  const lastEditRef = useRef(new Map<string, number>());
  const [, setVersion] = useState(0);

  const updateWithHistory = useCallback(
    (id: string, updates: Partial<EmailDraft>) => {
      const current = drafts.find((d) => d.id === id);
      if (current) {
        const changesDraft = updates.draft !== undefined && updates.draft !== current.draft;
        const changesResult = updates.result !== undefined && updates.result !== current.result;

        if (changesDraft || changesResult) {
          const now = Date.now();
          const isTypingBurst =
            !changesResult && now - (lastEditRef.current.get(id) ?? 0) < TYPING_WINDOW_MS;
          lastEditRef.current.set(id, now);

          if (!isTypingBurst) {
            const stack = historyRef.current.get(id) ?? [];
            const snapshot: Snapshot = { draft: current.draft, result: current.result };
            historyRef.current.set(id, [...stack, snapshot].slice(-MAX_HISTORY));
            setVersion((v) => v + 1);
          }
        }
      }
      updateDraft(id, updates);
    },
    [drafts, updateDraft]
  );

  const undo = useCallback(
    (id: string) => {
      const stack = historyRef.current.get(id);
      if (!stack || stack.length === 0) return;
      const previous = stack[stack.length - 1];
      historyRef.current.set(id, stack.slice(0, -1));
      lastEditRef.current.delete(id);
      updateDraft(id, previous);
      setVersion((v) => v + 1);
    },
    [updateDraft]
  );

  const canUndo = (id: string) => (historyRef.current.get(id)?.length ?? 0) > 0;

  return { updateWithHistory, undo, canUndo };
};
