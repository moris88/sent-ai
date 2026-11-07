import { fireEvent, render, screen } from '@testing-library/react';
import { type RefObject, useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownEditor } from '../../src/components/MarkdownEditor';

const onChangeSpy = vi.fn();

interface HarnessProps {
  initial: string;
  onUndo?: () => void;
  canUndo?: boolean;
}

const Harness = ({ initial, onUndo, canUndo }: HarnessProps) => {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  return (
    <MarkdownEditor
      value={value}
      onChange={(v) => {
        onChangeSpy(v);
        setValue(v);
      }}
      textareaRef={ref}
      onUndo={onUndo}
      canUndo={canUndo}
      placeholder="Scrivi"
    />
  );
};

const select = (start: number, end: number) => {
  const textarea = screen.getByPlaceholderText('Scrivi');
  if (textarea instanceof HTMLTextAreaElement) textarea.setSelectionRange(start, end);
};

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    onChangeSpy.mockReset();
  });

  it('applica il grassetto alla selezione', () => {
    render(<Harness initial="ciao mondo" />);
    select(0, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Grassetto' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith('**ciao** mondo');
  });

  it('usa il segnaposto senza selezione per corsivo e link', () => {
    render(<Harness initial="" />);
    select(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Corsivo' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith('*testo in corsivo*');
    select(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith('[testo del link](https://)*testo in corsivo*');
  });

  it('formatta per riga titoli ed elenchi', () => {
    render(<Harness initial={'a\nb'} />);
    select(0, 3);
    fireEvent.click(screen.getByRole('button', { name: 'Elenco numerato' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith('1. a\n2. b');
    select(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Elenco puntato' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith('- elemento1. a\n2. b');
    select(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Titolo' }));
    expect(onChangeSpy.mock.lastCall?.[0]).toMatch(/^## titolo/);
  });

  it('ignora la formattazione se la textarea non è disponibile', () => {
    const onChange = vi.fn();
    // Ref che resta sempre vuoto: React non riesce ad assegnare la textarea.
    const emptyRef: RefObject<HTMLTextAreaElement | null> = {
      get current() {
        return null;
      },
      set current(_value) {},
    };
    render(<MarkdownEditor value="" onChange={onChange} textareaRef={emptyRef} />);
    fireEvent.click(screen.getByRole('button', { name: 'Grassetto' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("mostra l'anteprima vuota e con contenuto", () => {
    const { unmount } = render(<Harness initial="  " />);
    fireEvent.click(screen.getByRole('button', { name: 'Anteprima' }));
    expect(screen.getByText('Nessun contenuto da mostrare.')).toBeInTheDocument();
    unmount();
    render(<Harness initial="**forte**" />);
    fireEvent.click(screen.getByRole('button', { name: 'Anteprima' }));
    expect(screen.getByText('forte').tagName).toBe('STRONG');
    expect(screen.getByRole('button', { name: 'Grassetto' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Modifica' }));
    expect(screen.getByPlaceholderText('Scrivi')).toBeInTheDocument();
  });

  it('gestisce il pulsante annulla e la digitazione', () => {
    const onUndo = vi.fn();
    render(<Harness initial="" onUndo={onUndo} canUndo />);
    fireEvent.click(screen.getByRole('button', { name: "Annulla l'ultima modifica" }));
    expect(onUndo).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByPlaceholderText('Scrivi'), { target: { value: 'x' } });
    expect(onChangeSpy).toHaveBeenLastCalledWith('x');
  });
});
