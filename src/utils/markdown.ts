import DOMPurify from 'dompurify';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Nel Markdown un a capo singolo non va a capo: lo rendiamo un a capo vero, come nella bozza.
export const preserveLineBreaks = (markdown: string): string =>
  markdown.replace(/([^\n])\n(?=[^\n])/g, '$1  \n');

// HTML pulito da Markdown: usato per la copia formattata negli appunti.
export const markdownToHtml = (markdown: string): string =>
  DOMPurify.sanitize(
    renderToStaticMarkup(
      createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, preserveLineBreaks(markdown))
    )
  );

// Testo semplice leggibile da Markdown: usato per l'invio via mailto, che non supporta l'HTML.
export const markdownToPlainText = (markdown: string): string =>
  markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1$2')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .trim();
