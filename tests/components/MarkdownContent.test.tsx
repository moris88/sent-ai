import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownContent } from '../../src/components/MarkdownContent';

describe('MarkdownContent', () => {
  it('renderizza grassetto, titoli ed elenchi', () => {
    render(<MarkdownContent>{'## Titolo\n\n**forte**\n\n- uno\n- due'}</MarkdownContent>);

    expect(screen.getByRole('heading', { level: 2, name: 'Titolo' })).toBeInTheDocument();
    expect(screen.getByText('forte').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('apre i link in una nuova scheda con rel sicuro', () => {
    render(<MarkdownContent>{'[sito](https://example.it)'}</MarkdownContent>);

    const link = screen.getByRole('link', { name: 'sito' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
