import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LocalStorageLimitModal from '../../src/components/LocalStorageLimitModal';

describe('LocalStorageLimitModal', () => {
  it('non si mostra se chiuso', () => {
    const { container } = render(
      <LocalStorageLimitModal isOpen={false} onClose={vi.fn()} usagePercent={90} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra la percentuale di utilizzo e chiude con Ho capito', () => {
    const onClose = vi.fn();
    render(<LocalStorageLimitModal isOpen onClose={onClose} usagePercent={86.4} />);

    expect(screen.getByText('86.4%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ho capito' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
