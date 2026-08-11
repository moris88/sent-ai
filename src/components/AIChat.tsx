import { Bot, Send, User } from 'lucide-react';
import { useState } from 'react';
import { refineEmail } from '../services/ai';
import type { EmailDraft } from '../types';

interface AIChatProps {
  drafts: EmailDraft[];
  checkApiKey: () => boolean;
}

export const AIChat = ({ drafts, checkApiKey }: AIChatProps) => {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !checkApiKey()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('sentai_api_key') || '';
      const provider = (localStorage.getItem('sentai_provider') as any) || 'gemini';
      const model = localStorage.getItem('sentai_model') || '';

      const context = drafts
        .map((d) => `Title: ${d.title}\nDraft: ${d.draft}\nResult: ${d.result}\n---`)
        .join('\n');

      const response = await refineEmail({
        persona: 'assistant',
        tone: 'professional',
        detail: 'concise',
        language: 'it',
        structure: 'text',
        context: `Here is the user's email history:\n${context}`,
        draft: `Question: ${userMessage}`,
        provider,
        apiKey,
        model,
      });

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', text: response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'ai', text: 'Errore nel generare la risposta.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4">
      <p className="italic text-sm text-gray-500">
        Qui puoi chiedere qualsiasi cosa, riguardo alle tue email raffinate. La conversazione non
        viene salvata, ad ogni caricamento della pagina.
      </p>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'ai' && <Bot className="w-6 h-6 text-blue-600 mt-1" />}
            <div
              className={`p-3 rounded-lg text-sm max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'}`}
            >
              {m.text}
            </div>
            {m.role === 'user' && <User className="w-6 h-6 text-slate-400 mt-1" />}
          </div>
        ))}
        {isLoading && (
          <div className="text-sm text-slate-500 animate-pulse">L'AI sta pensando...</div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chiedi qualcosa sulle tue email..."
          className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          type="button"
          className="cursor-pointer p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleSend}
          disabled={isLoading}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
