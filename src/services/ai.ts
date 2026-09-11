import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type Provider = "gemini" | "openai" | "anthropic" | "lmstudio";

const getLmStudioBaseUrl = (baseUrl?: string) => {
  let url = (
    baseUrl ||
    localStorage.getItem("sentai_lmstudio_url") ||
    "http://localhost:1234/api/v1"
  )
    .trim()
    .replace(/\/$/, "");

  if (url.endsWith("/chat/completions")) {
    url = url.slice(0, -"/chat/completions".length);
  } else if (url.endsWith("/chat")) {
    url = url.slice(0, -"/chat".length);
  } else if (url.endsWith("/models")) {
    url = url.slice(0, -"/models".length);
  }

  url = url.replace(/\/$/, "");

  if (url.endsWith("/v1") && !url.endsWith("/api/v1")) {
    url = `${url.slice(0, -3)}/api/v1`;
  } else if (!url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }

  return url;
};

const getLmStudioContent = (data: any): string => {
  if (Array.isArray(data?.output)) {
    const msg =
      data.output.find((o: any) => o?.type === "message") || data.output[0];
    if (typeof msg?.content === "string") return msg.content;
    if (typeof msg === "string") return msg;
  }
  if (typeof data?.output === "string") return data.output;
  if (data?.choices?.[0]?.message?.content)
    return data.choices[0].message.content;
  if (typeof data?.content === "string") return data.content;
  if (typeof data?.response === "string") return data.response;
  return "";
};

const completeWithLmStudio = async (
  model: string,
  apiKey: string,
  prompt: string,
  temperature?: number,
  systemPrompt?: string,
  lmStudioUrl?: string,
) => {
  const baseUrl = getLmStudioBaseUrl(lmStudioUrl);
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  if (apiKey) {
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
  }

  const payload: Record<string, any> = {
    model: model,
    input: prompt,
  };

  if (systemPrompt) {
    payload.system_prompt = systemPrompt;
  }

  if (typeof temperature === "number") {
    payload.temperature = temperature;
  }

  const raw = JSON.stringify(payload);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(`${baseUrl}/chat`, requestOptions);
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `LM Studio ha restituito l'errore ${response.status}${
        errText ? `: ${errText}` : "."
      }`,
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
    return completeWithLmStudio(
      model,
      apiKey,
      prompt,
      opts.temperature,
      "You are an AI assistant specialized in writing professional emails.",
    );
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
        const modelList = data.data || data.models || data;
        if (Array.isArray(modelList)) {
          return modelList.map((m: any) =>
            typeof m === "string"
              ? m
              : m.id || m.name || m.model_instance_id || String(m),
          );
        }
        return [];
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
      (await completeWithLmStudio(
        model,
        apiKey,
        prompt,
        temperature,
        "You are an AI assistant specialized in editing professional emails.",
      )) || result
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
