import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type Provider = "gemini" | "openai" | "anthropic" | "lmstudio";

const getLmStudioBaseUrl = (baseUrl?: string) =>
  (
    baseUrl ||
    localStorage.getItem("sentai_lmstudio_url") ||
    "http://localhost:1234/v1"
  ).replace(/\/$/, "");

const completeWithLmStudio = async (
  model: string,
  apiKey: string,
  prompt: string,
  temperature?: number,
) => {
  const response = await fetch(`${getLmStudioBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });
  if (!response.ok)
    throw new Error(`LM Studio ha restituito l'errore ${response.status}.`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
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
  temperature?: number;
  provider: Provider;
  apiKey: string;
  model: string;
  prompt?: string;
};

export const refineEmail = async (options: RefineOptions): Promise<string> => {
  const { provider, apiKey, model, ...opts } = options;

  const prompt = `
  You are an AI assistant specialized in writing professional emails.

  <persona>${opts.persona}</persona>
  <tone>${opts.tone}</tone>
  <detail>${opts.detail}</detail>
  <language>${opts.language}</language>
  <structure>${opts.structure}</structure>
  ${opts.keywords ? `<keywords>${opts.keywords}</keywords>` : ""}

  <context>${opts.context || "No context provided."}</context>
  <draft>${opts.draft}</draft>
  ${opts.prompt ? `<additional_prompt>${opts.prompt}</additional_prompt>` : ""}

  Write ONLY the email text in ${opts.language}.`;

  if (provider === "openai") {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: opts.temperature,
    });
    return completion.choices[0].message.content || "";
  }

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      temperature: opts.temperature,
    });
    // @ts-expect-error
    return message.content[0].text || "";
  }

  if (provider === "lmstudio") {
    return completeWithLmStudio(model, apiKey, prompt, opts.temperature);
  }

  // Default to Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model,
  });
  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: opts.temperature },
  });
  return result.response.text();
};

export async function getModels(
  provider: Provider,
  apiKey: string,
  lmStudioUrl?: string,
): Promise<string[]> {
  if (provider === "lmstudio") {
    return fetch(`${getLmStudioBaseUrl(lmStudioUrl)}/models`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error?.message ||
              `LM Studio ha restituito l'errore ${response.status}.`,
          );
        }
        return (data.data || []).map((model: { id: string }) => model.id);
      })
      .catch((error) => {
        throw error instanceof Error
          ? error
          : new Error("Impossibile raggiungere LM Studio.");
      });
  }

  if (provider === "openai") {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    return openai.models
      .list()
      .then((res) => res.data.map((model) => model.id));
  }

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    return anthropic.models
      .list()
      .then((res) => res.data.map((model) => model.display_name));
  }

  let OriginalModels: any = {};
  const nameOnlyList: string[] = [];
  const realModelNames: string[] = [];

  // gemini api
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  )
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message ||
            `Google Gemini ha restituito l'errore ${response.status}.`,
        );
      }
      return data;
    })
    .then((data) => {
      OriginalModels = data;
      // get the name only list

      OriginalModels.models.forEach((model: { name: string }) => {
        nameOnlyList.push(model.name);
      });

      // get the real model name

      nameOnlyList.forEach((model) => {
        const name = model.split("/")[1];
        realModelNames.push(name);
      });

      return realModelNames;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

export const generateTitle = async (
  context: string,
  draft: string,
  provider: Provider,
  apiKey: string,
  model: string,
): Promise<string> => {
  const prompt = `
  Analyze the following email context and draft and generate a concise, descriptive title for the conversation.
  Return ONLY the title text, no quotes or additional formatting.
  
  <context>${context || "No context provided."}</context>
  <draft>${draft || "No draft provided."}</draft>
  `;

  if (provider === "openai") {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    return (
      completion.choices[0].message.content?.trim() || "Nuova conversazione"
    );
  }

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });
    // @ts-expect-error
    return message.content[0].text?.trim() || "Nuova conversazione";
  }

  if (provider === "lmstudio") {
    return completeWithLmStudio(model, apiKey, prompt);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model,
  });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim() || "Nuova conversazione";
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

export const generateSubject = async (
  options: GenerateSubjectOptions,
): Promise<string> => {
  const { provider, apiKey, model, context, draft, result, language } = options;

  const prompt = `
  Analyze the following email context and text and generate ONLY a concise, professional email subject line in ${language}.
  Return ONLY the subject text, without quotes, prefixes (like "Oggetto:" or "Subject:") or additional formatting.

  <context>${context || "No context provided."}</context>
  <draft>${draft || "No draft provided."}</draft>
  ${result ? `<refined_email>${result}</refined_email>` : ""}
  `;

  if (provider === "openai") {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0].message.content?.trim() || "";
  }

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });
    // @ts-expect-error
    return message.content[0].text?.trim() || "";
  }

  if (provider === "lmstudio") {
    return completeWithLmStudio(model, apiKey, prompt);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model,
  });
  const result_ = await geminiModel.generateContent(prompt);
  return result_.response.text().trim() || "";
};

type ReviseEmailOptions = {
  result: string;
  instructions: string;
  language: string;
  provider: Provider;
  apiKey: string;
  model: string;
  temperature?: number;
};

export const reviseEmail = async (
  options: ReviseEmailOptions,
): Promise<string> => {
  const {
    provider,
    apiKey,
    model,
    result,
    instructions,
    language,
    temperature,
  } = options;

  const prompt = `
  You are an AI assistant specialized in editing professional emails.
  Modify the following email applying ONLY the requested changes, keeping the rest of the meaning and structure intact unless the changes require otherwise.
  Write ONLY the updated email text in ${language}, without explanations, notes or additional formatting.

  <email>${result}</email>
  <requested_changes>${instructions}</requested_changes>
  `;

  if (provider === "openai") {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    });
    return completion.choices[0].message.content?.trim() || result;
  }

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      temperature,
    });
    // @ts-expect-error
    return message.content[0].text?.trim() || result;
  }

  if (provider === "lmstudio") {
    return (
      (await completeWithLmStudio(model, apiKey, prompt, temperature)) || result
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model,
  });
  const result_ = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  });
  return result_.response.text().trim() || result;
};
