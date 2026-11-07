import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { createPrivacySession, notifyRedactions, withPrivacy } from '../utils/redact';

export type Provider = 'gemini' | 'openai' | 'lmstudio';

// Applicata solo ai provider che la supportano: i modelli di ragionamento OpenAI la rifiutano.
const DEFAULT_TEMPERATURE = 1;

// Il modello risponde in Markdown: l'app lo mostra formattato e lo converte per copia e invio.
const MARKDOWN_OUTPUT_RULE =
  'Format the email as Markdown: use **bold** for emphasis where useful, "-" bullet lists and numbered lists when they help, and plain paragraphs otherwise. Do not wrap the output in a code block.';

const getLmStudioBaseUrl = (baseUrl?: string) => {
  let url = (
    baseUrl ||
    localStorage.getItem('sentai_lmstudio_url') ||
    'http://localhost:1234/api/v1'
  )
    .trim()
    .replace(/\/$/, '');

  if (url.endsWith('/chat/completions')) {
    url = url.slice(0, -'/chat/completions'.length);
  } else if (url.endsWith('/chat')) {
    url = url.slice(0, -'/chat'.length);
  } else if (url.endsWith('/models')) {
    url = url.slice(0, -'/models'.length);
  }

  url = url.replace(/\/$/, '');

  if (url.endsWith('/v1') && !url.endsWith('/api/v1')) {
    url = `${url.slice(0, -3)}/api/v1`;
  } else if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }

  return url;
};

const getLmStudioContent = (data: any): string => {
  if (Array.isArray(data?.output)) {
    const msg = data.output.find((o: any) => o?.type === 'message') || data.output[0];
    if (typeof msg?.content === 'string') return msg.content;
    if (typeof msg === 'string') return msg;
  }
  if (typeof data?.output === 'string') return data.output;
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
  if (typeof data?.content === 'string') return data.content;
  if (typeof data?.response === 'string') return data.response;
  return '';
};

const completeWithLmStudio = async (
  model: string,
  apiKey: string,
  prompt: string,
  systemPrompt?: string,
  lmStudioUrl?: string
) => {
  const baseUrl = getLmStudioBaseUrl(lmStudioUrl);
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  if (apiKey) {
    myHeaders.append('Authorization', `Bearer ${apiKey}`);
  }

  const payload: Record<string, any> = {
    model: model,
    input: prompt,
    temperature: DEFAULT_TEMPERATURE,
  };

  if (systemPrompt) {
    payload.system_prompt = systemPrompt;
  }

  const raw = JSON.stringify(payload);

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  const response = await fetch(`${baseUrl}/chat`, requestOptions);
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `LM Studio ha restituito l'errore ${response.status}${errText ? `: ${errText}` : '.'}`
    );
  }

  const data = await response.json();
  return getLmStudioContent(data).trim();
};

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
  provider: Provider;
  apiKey: string;
  model: string;
  prompt?: string;
};

const refineEmailImpl = async (options: RefineOptions): Promise<string> => {
  const { provider, apiKey, model, ...opts } = options;

  const prompt = `
  You are an AI assistant specialized in writing professional emails.

  <persona>${opts.persona}</persona>
  <tone>${opts.tone}</tone>
  <detail>${opts.detail}</detail>
  <language>${opts.language}</language>
  <structure>${opts.structure}</structure>
  ${opts.keywords ? `<keywords>${opts.keywords}</keywords>` : ''}

  <context>${opts.context || 'No context provided.'}</context>
  <draft>${opts.draft}</draft>
  ${opts.prompt ? `<additional_prompt>${opts.prompt}</additional_prompt>` : ''}

  ${MARKDOWN_OUTPUT_RULE}
  Write ONLY the email text in ${opts.language}.`;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0].message.content || '';
  }

  if (provider === 'lmstudio') {
    return completeWithLmStudio(
      model,
      apiKey,
      prompt,
      'You are an AI assistant specialized in writing professional emails.'
    );
  }

  // Default to Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: DEFAULT_TEMPERATURE },
  });
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text();
};

const completePrompt = async (
  provider: Provider,
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> => {
  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0].message.content?.trim() || '';
  }

  if (provider === 'lmstudio') {
    return (await completeWithLmStudio(model, apiKey, prompt, systemPrompt)).trim();
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: DEFAULT_TEMPERATURE },
  });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
};

type WriteEmailOptions = Omit<RefineOptions, 'draft'> & {
  instructions: string;
};

// Scrive l'email da zero partendo dal contesto e dalle indicazioni dell'utente, senza una bozza.
const writeEmailImpl = async (options: WriteEmailOptions): Promise<string> => {
  const { provider, apiKey, model, ...opts } = options;

  const prompt = `
  You are an AI assistant specialized in writing professional emails.
  The user does not have a draft: write the email from scratch, as a reply that fits the conversation context and follows the user's instructions.

  <persona>${opts.persona}</persona>
  <tone>${opts.tone}</tone>
  <detail>${opts.detail}</detail>
  <language>${opts.language}</language>
  <structure>${opts.structure}</structure>
  ${opts.keywords ? `<keywords>${opts.keywords}</keywords>` : ''}

  <context>${opts.context || 'No context provided.'}</context>
  <instructions>${opts.instructions}</instructions>
  ${opts.prompt ? `<additional_prompt>${opts.prompt}</additional_prompt>` : ''}

  ${MARKDOWN_OUTPUT_RULE}
  Write ONLY the email text in ${opts.language}.`;

  return completePrompt(
    provider,
    apiKey,
    model,
    prompt,
    'You are an AI assistant specialized in writing professional emails.'
  );
};

type QuerySavedEmailsOptions = {
  question: string;
  emails: string;
  provider: Provider;
  apiKey: string;
  model: string;
};

const querySavedEmailsImpl = async (options: QuerySavedEmailsOptions): Promise<string> => {
  const { question, emails, provider, apiKey, model } = options;
  const prompt = `
You are an AI assistant answering questions about the user's saved emails.
Use only the email data provided below. If the answer is not present, say so clearly.
Answer the user's question directly in Italian. Do not write or rewrite an email unless explicitly asked.

<saved_emails>${emails || 'No saved emails.'}</saved_emails>
<question>${question}</question>
`;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0].message.content?.trim() || '';
  }

  if (provider === 'lmstudio') {
    return completeWithLmStudio(
      model,
      apiKey,
      prompt,
      'You are an AI assistant answering questions about saved emails.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: DEFAULT_TEMPERATURE },
  });
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text().trim();
};

export async function getModels(
  provider: Provider,
  apiKey: string,
  lmStudioUrl?: string
): Promise<string[]> {
  if (provider === 'lmstudio') {
    return fetch(`${getLmStudioBaseUrl(lmStudioUrl)}/models`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error?.message || `LM Studio ha restituito l'errore ${response.status}.`
          );
        }
        const modelList = data.data || data.models || data;
        if (Array.isArray(modelList)) {
          return modelList.map((m: any) =>
            typeof m === 'string' ? m : m.id || m.name || m.model_instance_id || String(m)
          );
        }
        return [];
      })
      .catch((error) => {
        throw error instanceof Error ? error : new Error('Impossibile raggiungere LM Studio.');
      });
  }

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    // La lista OpenAI non indica le capacità: escludiamo per nome le famiglie non testuali.
    const NON_CHAT_OPENAI_MODEL = /embedding|whisper|tts|dall-e|moderation|transcribe|image|davinci|babbage|realtime/i;
    return openai.models
      .list()
      .then((res) => res.data.map((model) => model.id).filter((id) => !NON_CHAT_OPENAI_MODEL.test(id)));
  }

  let OriginalModels: any = {};
  const nameOnlyList: string[] = [];
  const realModelNames: string[] = [];

  // gemini api
  return await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || `Google Gemini ha restituito l'errore ${response.status}.`
        );
      }
      return data;
    })
    .then((data) => {
      OriginalModels = data;
      // get the name only list

      // Solo i modelli che generano testo: esclude embedding, audio e immagini.
      OriginalModels.models.forEach(
        (model: { name: string; supportedGenerationMethods?: string[] }) => {
          if (model.supportedGenerationMethods?.includes('generateContent')) {
            nameOnlyList.push(model.name);
          }
        }
      );

      // get the real model name

      nameOnlyList.forEach((model) => {
        const name = model.split('/')[1];
        realModelNames.push(name);
      });

      return realModelNames;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

const generateTitleImpl = async (
  context: string,
  draft: string,
  provider: Provider,
  apiKey: string,
  model: string
): Promise<string> => {
  const prompt = `
  Analyze the following email context and draft and generate a concise, descriptive title for the conversation.
  Return ONLY the title text, no quotes or additional formatting.
  
  <context>${context || 'No context provided.'}</context>
  <draft>${draft || 'No draft provided.'}</draft>
  `;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0].message.content?.trim() || 'Nuova conversazione';
  }

  if (provider === 'lmstudio') {
    return completeWithLmStudio(model, apiKey, prompt);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: DEFAULT_TEMPERATURE },
  });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim() || 'Nuova conversazione';
};

type GenerateSubjectOptions = {
  context: string;
  draft: string;
  result?: string;
  language: string;
  provider: Provider;
  apiKey: string;
  model: string;
};

const generateSubjectImpl = async (options: GenerateSubjectOptions): Promise<string> => {
  const { provider, apiKey, model, context, draft, result, language } = options;

  const prompt = `
  Analyze the following email context and text and generate ONLY a concise, professional email subject line in ${language}.
  Return ONLY the subject text, without quotes, prefixes (like "Oggetto:" or "Subject:") or additional formatting.

  <context>${context || 'No context provided.'}</context>
  <draft>${draft || 'No draft provided.'}</draft>
  ${result ? `<refined_email>${result}</refined_email>` : ''}
  `;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0].message.content?.trim() || '';
  }

  if (provider === 'lmstudio') {
    return completeWithLmStudio(model, apiKey, prompt);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: DEFAULT_TEMPERATURE },
  });
  const result_ = await geminiModel.generateContent(prompt);
  return result_.response.text().trim() || '';
};

type ReviseEmailOptions = {
  result: string;
  instructions: string;
  language: string;
  provider: Provider;
  apiKey: string;
  model: string;
};

const reviseEmailImpl = async (options: ReviseEmailOptions): Promise<string> => {
  const { provider, apiKey, model, result, instructions, language } = options;

  const prompt = `
  You are an AI assistant specialized in editing professional emails.
  Modify the following email applying ONLY the requested changes, keeping the rest of the meaning and structure intact unless the changes require otherwise.
  Write ONLY the updated email text in ${language}, without explanations or notes. ${MARKDOWN_OUTPUT_RULE}

  <email>${result}</email>
  <requested_changes>${instructions}</requested_changes>
  `;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });
    return completion.choices[0].message.content?.trim() || result;
  }

  if (provider === 'lmstudio') {
    return (
      (await completeWithLmStudio(
        model,
        apiKey,
        prompt,
        'You are an AI assistant specialized in editing professional emails.'
      )) || result
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: DEFAULT_TEMPERATURE },
  });
  const result_ = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result_.response.text().trim() || result;
};

// Oscuramento dei dati personali e sensibili: i testi inviati al modello sono segnaposto, la risposta viene ripristinata.
export const refineEmail = withPrivacy(refineEmailImpl);
export const writeEmail = withPrivacy(writeEmailImpl);
export const querySavedEmails = withPrivacy(querySavedEmailsImpl);
export const generateSubject = withPrivacy(generateSubjectImpl);
export const reviseEmail = withPrivacy(reviseEmailImpl);

export const generateTitle = async (
  context: string,
  draft: string,
  provider: Provider,
  apiKey: string,
  model: string
): Promise<string> => {
  const session = createPrivacySession();
  const redactedContext = session.redact(context);
  const redactedDraft = session.redact(draft);
  notifyRedactions({
    summary: session.summary(),
    sentFields: [
      { field: 'context', text: redactedContext },
      { field: 'draft', text: redactedDraft },
    ],
  });
  const title = await generateTitleImpl(redactedContext, redactedDraft, provider, apiKey, model);
  return session.restore(title);
};

// Chiamata di prova minima per capire se un modello risponde con la chiave inserita.
export const verifyModel = async (provider: Provider, apiKey: string, model: string): Promise<string> => {
  const reply = await completePrompt(provider, apiKey, model, 'Rispondi solo con la parola: ok');
  if (!reply) throw new Error('Il modello non ha restituito alcuna risposta.');
  return reply;
};
