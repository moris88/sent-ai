import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type Provider = "gemini" | "openai" | "anthropic";

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
): Promise<string[]> {
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
    .then((response) => {
      return response.json();
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
      return [];
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
