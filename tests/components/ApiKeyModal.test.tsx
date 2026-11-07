import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ApiKeyModal from '../../src/components/ApiKeyModal';

describe('ApiKeyModal', () => {
  it('non renderizza nulla se chiuso', () => {
    const { container } = render(<ApiKeyModal isOpen={false} onSettings={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('apre le impostazioni dal pulsante', () => {
    const onSettings = vi.fn();
    render(<ApiKeyModal isOpen onSettings={onSettings} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Vai alle Impostazioni' }));
    expect(onSettings).toHaveBeenCalledOnce();
  });
});
