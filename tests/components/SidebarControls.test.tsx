import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarControls } from '../../src/components/SidebarControls';
import { DETAIL_LEVELS, type EmailDraft, LANGUAGES, PERSONAS, TONES } from '../../src/types';

const draft: EmailDraft = {
  id: '1',
  title: '',
  context: '',
  draft: '',
  result: '',
  subject: '',
  persona: PERSONAS[0].id,
  tone: TONES[0].id,
  detail: DETAIL_LEVELS[0].id,
  language: LANGUAGES[0].id,
  structure: '',
  keywords: 'k',
  generateSubject: false,
  updatedAt: 0,
};

describe('SidebarControls', () => {
  it('aggiorna persona e tono e si chiude', () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    render(<SidebarControls isOpen draft={draft} onUpdate={onUpdate} onClose={onClose} />);
    fireEvent.click(screen.getByTitle(PERSONAS[1].description));
    expect(onUpdate).toHaveBeenCalledWith({ persona: PERSONAS[1].id });
    fireEvent.click(screen.getByTitle(TONES[1].description));
    expect(onUpdate).toHaveBeenCalledWith({ tone: TONES[1].id });
    fireEvent.click(screen.getByTitle('Chiudi'));
    expect(onClose).toHaveBeenCalled();
  });

  it('gestisce le impostazioni avanzate', () => {
    const onUpdate = vi.fn();
    render(<SidebarControls isOpen={false} draft={draft} onUpdate={onUpdate} onClose={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: /Impostazioni Avanzate/ });
    fireEvent.click(toggle);

    fireEvent.change(screen.getByLabelText('Lingua'), { target: { value: LANGUAGES[1].id } });
    expect(onUpdate).toHaveBeenCalledWith({ language: LANGUAGES[1].id });
    fireEvent.click(screen.getByRole('button', { name: DETAIL_LEVELS[1].label }));
    expect(onUpdate).toHaveBeenCalledWith({ detail: DETAIL_LEVELS[1].id });
    fireEvent.change(screen.getByLabelText('Parole Chiave'), { target: { value: 'nuove' } });
    expect(onUpdate).toHaveBeenCalledWith({ keywords: 'nuove' });
    fireEvent.click(screen.getByLabelText('Genera Oggetto Email'));
    expect(onUpdate).toHaveBeenCalledWith({ generateSubject: true });

    fireEvent.click(toggle);
    expect(screen.queryByLabelText('Lingua')).not.toBeInTheDocument();
  });
});
