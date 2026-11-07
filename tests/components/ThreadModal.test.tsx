import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThreadModal } from '../../src/components/ThreadModal';

const setup = (isOpen: boolean) => {
  const props = {
    isOpen,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    value: 'risposta',
    onChange: vi.fn(),
    onPaste: vi.fn(),
  };
  const utils = render(<ThreadModal {...props} />);
  return { ...utils, props };
};

describe('ThreadModal', () => {
  it('non renderizza nulla se chiuso', () => {
    const { container } = setup(false);
    expect(container).toBeEmptyDOMElement();
  });

  it("inoltra le azioni dell'utente", () => {
    const { props } = setup(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'nuovo' } });
    fireEvent.click(screen.getByRole('button', { name: /Incolla/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi al Contesto' }));
    expect(props.onChange).toHaveBeenCalledWith('nuovo');
    expect(props.onPaste).toHaveBeenCalledWith('context');
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });
});
