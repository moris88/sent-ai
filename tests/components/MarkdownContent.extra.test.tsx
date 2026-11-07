import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownContent } from '../../src/components/MarkdownContent';

describe('MarkdownContent (elementi aggiuntivi)', () => {
  it('renderizza tutti gli elementi personalizzati', () => {
    const markdown = [
      '# Uno',
      '### Tre',
      '*corsivo*',
      '1. primo',
      '> citazione',
      '`codice`',
      '---',
      'fine',
    ].join('\n\n');
    const { container } = render(<MarkdownContent>{markdown}</MarkdownContent>);

    expect(screen.getByRole('heading', { level: 1, name: 'Uno' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Tre' })).toBeInTheDocument();
    expect(screen.getByText('corsivo').tagName).toBe('EM');
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).toHaveTextContent('citazione');
    expect(screen.getByText('codice').tagName).toBe('CODE');
    expect(container.querySelector('hr')).toBeInTheDocument();
  });
});
