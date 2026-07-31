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
  prompt?: string;
};

export const refineEmail = async (options: RefineOptions): Promise<string> => {
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
${opts.prompt ? `PROMPT AGGIUNTIVO: ${opts.prompt}` : ''}

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
  const geminiModel = genAI.getGenerativeModel({
    model: model || 'gemini-2.0-flash',
  });
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: opts.temperature },
  });
  return result.response.text();
};

export async function getModels(provider: Provider, apiKey: string): Promise<string[]> {
  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    return openai.models.list().then((res) => res.data.map((model) => model.id));
  }

  if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    return anthropic.models.list().then((res) => res.data.map((model) => model.display_name));
  }

  let OriginalModels: any = {};
  const nameOnlyList: string[] = [];
  const realModelNames: string[] = [];
  let GeminiModelsSplitByComma = '';
  // gemini api
  return await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      OriginalModels = data;
      console.log(data);
      // get the name only list

      OriginalModels.models.forEach((model: { name: string }) => {
        nameOnlyList.push(model.name);
      });

      // get the real model name

      nameOnlyList.forEach((model) => {
        const name = model.split('/')[1];
        realModelNames.push(name);
      });

      GeminiModelsSplitByComma = realModelNames.join(',');

      // print
      console.log(GeminiModelsSplitByComma);
      console.log(nameOnlyList);
      console.log(realModelNames);

      return realModelNames;
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
}
