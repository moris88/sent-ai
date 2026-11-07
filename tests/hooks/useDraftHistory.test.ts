import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDraftHistory } from '../../src/hooks/useDraftHistory';
import type { EmailDraft } from '../../src/types';

const draft = (overrides: Partial<EmailDraft> = {}): EmailDraft =>
  ({
    id: 'a',
    draft: 'Testo iniziale',
    result: '',
    subject: '',
    ...overrides,
  }) as EmailDraft;

describe('useDraftHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T10:00:00Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('non permette di annullare senza modifiche', () => {
    const { result } = renderHook(() => useDraftHistory([draft()], vi.fn()));

    expect(result.current.canUndo('a')).toBe(false);
  });

  it('ripristina la versione precedente con undo', () => {
    const updateDraft = vi.fn();
    const drafts = [draft()];
    const { result } = renderHook(() => useDraftHistory(drafts, updateDraft));

    act(() => result.current.updateWithHistory('a', { draft: 'Nuovo testo' }));
    expect(updateDraft).toHaveBeenLastCalledWith('a', { draft: 'Nuovo testo' });
    expect(result.current.canUndo('a')).toBe(true);

    act(() => result.current.undo('a'));
    expect(updateDraft).toHaveBeenLastCalledWith('a', { draft: 'Testo iniziale', result: '' });
    expect(result.current.canUndo('a')).toBe(false);
  });

  it('raggruppa le digitazioni ravvicinate in un unico passo', () => {
    const updateDraft = vi.fn();
    const drafts = [draft()];
    const { result } = renderHook(() => useDraftHistory(drafts, updateDraft));

    act(() => result.current.updateWithHistory('a', { draft: 'T' }));
    vi.advanceTimersByTime(200);
    act(() => result.current.updateWithHistory('a', { draft: 'Te' }));

    act(() => result.current.undo('a'));
    expect(result.current.canUndo('a')).toBe(false);
  });

  it('registra una nuova voce dopo la finestra di digitazione', () => {
    const drafts = [draft()];
    const { result } = renderHook(() => useDraftHistory(drafts, vi.fn()));

    act(() => result.current.updateWithHistory('a', { draft: 'Uno' }));
    vi.advanceTimersByTime(2000);
    act(() => result.current.updateWithHistory('a', { draft: 'Due' }));

    act(() => result.current.undo('a'));
    expect(result.current.canUndo('a')).toBe(true);
  });

  it('non registra modifiche che non cambiano il testo', () => {
    const { result } = renderHook(() => useDraftHistory([draft()], vi.fn()));

    act(() => result.current.updateWithHistory('a', { draft: 'Testo iniziale' }));

    expect(result.current.canUndo('a')).toBe(false);
  });

  it('ignora undo su una bozza sconosciuta', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() => useDraftHistory([draft()], updateDraft));

    act(() => result.current.undo('inesistente'));

    expect(updateDraft).not.toHaveBeenCalled();
  });
});
