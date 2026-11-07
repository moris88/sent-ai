import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDrafts } from '../../src/hooks/useDrafts';

describe('useDrafts', () => {
  it('crea una bozza predefinita se localStorage è vuoto', () => {
    const { result } = renderHook(() => useDrafts());
    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].id).toBe('1');
    expect(JSON.parse(localStorage.getItem('sentai_drafts') ?? '[]')).toHaveLength(1);
  });

  it('carica le bozze salvate in localStorage', () => {
    localStorage.setItem('sentai_drafts', JSON.stringify([{ id: 'x', title: 'Salvata' }]));
    const { result } = renderHook(() => useDrafts());
    expect(result.current.drafts[0].title).toBe('Salvata');
  });

  it('crea, aggiorna ed elimina bozze', () => {
    const { result } = renderHook(() => useDrafts());
    let newId = '';
    act(() => {
      newId = result.current.createDraft();
    });
    expect(result.current.drafts[0].id).toBe(newId);
    expect(result.current.drafts).toHaveLength(2);

    act(() => result.current.updateDraft(newId, { title: 'Nuovo titolo' }));
    expect(result.current.drafts[0].title).toBe('Nuovo titolo');
    expect(result.current.drafts[1].title).toBe('');

    act(() => result.current.deleteDraft(newId));
    expect(result.current.drafts.map((d) => d.id)).toEqual(['1']);
    expect(JSON.parse(localStorage.getItem('sentai_drafts') ?? '[]')).toHaveLength(1);
  });

  it('espone setDrafts per sostituire le bozze', () => {
    const { result } = renderHook(() => useDrafts());
    act(() => result.current.setDrafts([]));
    expect(result.current.drafts).toEqual([]);
  });
});
