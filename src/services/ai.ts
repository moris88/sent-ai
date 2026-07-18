import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export type Provider = 'gemini' | 'openai' | 'anthropic';

export const getProvider = (): Provider =>
  (localStorage.getItem('sentai_provider') as Provider) || 'gemini';

type RefineOptions = {
  persona: string;
  tone: string;
  detail: string;
  language: string;
  structure: string;
  keywords?: string;
  generateSubject?: boolean;
  context?: string;
  draft: string;
  temperature?: number;
  provider: Provider;
  apiKey: string;
  model?: string;
};

export const refineEmail = async (
  options: RefineOptions
): Promise<string> => {
  const { provider, apiKey, model, ...opts } = options;

  const prompt = `
Sei un assistente AI specializzato nella scrittura di email professionali.
PERSONA: ${opts.persona}
TONO: ${opts.tone}
DETTAGLIO: ${opts.detail}
LINGUA: ${opts.language}
STRUTTURA: ${opts.structure}
${opts.keywords ? `PAROLE CHIAVE: ${opts.keywords}` : ''}
${opts.generateSubject ? `GENERA ANCHE UN OGGETTO EMAIL.` : ''}

CONTESTO: ${opts.context || 'Nessun contesto.'}
BOZZA: ${opts.draft}

Scrivi SOLO il testo dell'email, in ${opts.language}.`;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature,
    });
    return completion.choices[0].message.content || '';
  }

  if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const message = await anthropic.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature,
    });
    // @ts-expect-error
    return message.content[0].text || '';
  }

  // Default to Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash' });
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: opts.temperature },
  });
  return result.response.text();
};
