import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { preserveLineBreaks } from '../utils/markdown';

const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="mb-3 text-xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 text-lg font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-base font-semibold">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary-600 underline underline-offset-2 dark:text-primary-400"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-primary-300 pl-3 italic text-slate-600 dark:border-primary-700 dark:text-slate-400">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm dark:bg-slate-800">
      {children}
    </code>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
};

export const MarkdownContent = ({ children }: { children: string }) => (
  <div className="wrap-break-word text-slate-800 dark:text-slate-200">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {preserveLineBreaks(children)}
    </ReactMarkdown>
  </div>
);
