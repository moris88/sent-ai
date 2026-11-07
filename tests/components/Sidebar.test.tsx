import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from '../../src/components/Sidebar';
import type { EmailDraft } from '../../src/types';

vi.mock('../../src/components/AIChat', () => ({
  AIChat: () => <div>chat finta</div>,
}));

const makeDraft = (id: string, overrides: Partial<EmailDraft> = {}): EmailDraft => ({
  id,
  title: `Bozza ${id}`,
  context: '',
  draft: '',
  result: '',
  subject: '',
  persona: 'dev',
  tone: 'friendly',
  detail: 'balanced',
  language: 'it',
  structure: '',
  keywords: '',
  generateSubject: false,
  updatedAt: Date.now(),
  ...overrides,
});

const setup = (isLocked?: boolean, isOpen = true) => {
  const props = {
    drafts: [makeDraft('a', { draft: 'testo' }), makeDraft('b', { title: '' })],
    activeId: 'a',
    isOpen,
    setActiveId: vi.fn(),
    createDraft: vi.fn(),
    onDelete: vi.fn(),
    updateDraft: vi.fn(),
    checkApiKey: vi.fn(() => true),
    onAiError: vi.fn(),
    isLocked,
  };
  render(<Sidebar {...props} />);
  return props;
};

describe('Sidebar', () => {
  it('elenca le bozze e gestisce le azioni', () => {
    const props = setup();
    expect(screen.getByText('È presente del contenuto')).toBeInTheDocument();
    expect(screen.getByText('Nessun contenuto...')).toBeInTheDocument();
    // senza titolo si usa l'id
    const titles = screen.getAllByLabelText('Titolo della bozza');
    expect(titles[1]).toHaveValue('b');

    fireEvent.change(titles[0], { target: { value: 'Nuovo' } });
    expect(props.updateDraft).toHaveBeenCalledWith('a', { title: 'Nuovo' });
    fireEvent.focus(titles[1]);
    expect(props.setActiveId).toHaveBeenCalledWith('b');

    fireEvent.click(screen.getAllByLabelText('Elimina bozza')[1]);
    expect(props.onDelete).toHaveBeenCalledWith('b');

    fireEvent.click(screen.getByTitle('Crea Nuova Bozza'));
    expect(props.createDraft).toHaveBeenCalled();

    const items = screen.getAllByRole('button', { name: /contenuto/ });
    expect(items[0]).toHaveAttribute('aria-current', 'true');
    fireEvent.click(items[1]);
    expect(props.setActiveId).toHaveBeenLastCalledWith('b');
  });

  it('blocca il cambio bozza durante una elaborazione', () => {
    setup(true, false);
    expect(screen.getByText(/Elaborazione in corso/)).toBeInTheDocument();
    expect(screen.getByTitle('Crea Nuova Bozza')).toBeDisabled();
    expect(screen.getAllByLabelText('Titolo della bozza')[1]).toBeDisabled();
  });

  it('passa alla chat e torna alle bozze', () => {
    setup();
    fireEvent.click(screen.getByTitle('Chat con AI'));
    expect(screen.getByText('chat finta')).toBeInTheDocument();
    expect(screen.queryByTitle('Crea Nuova Bozza')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Le tue email'));
    expect(screen.getByTitle('Crea Nuova Bozza')).toBeInTheDocument();
  });
});
