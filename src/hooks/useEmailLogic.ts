import { useState } from "react";
import { generateSubject, refineEmail, reviseEmail } from "../services/ai";
import type { EmailDraft } from "../types";

export const useEmailLogic = (
  activeDraft: EmailDraft,
  updateActiveDraft: (updates: Partial<EmailDraft>) => void,
  setIsSettingsOpen: (open: boolean) => void,
  onAiError: (message: string) => void,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isModifying, setIsModifying] = useState(false);

  const getAiConfig = () => ({
    provider: (localStorage.getItem("sentai_provider") as any) || "gemini",
    apiKey: localStorage.getItem("sentai_api_key") || "",
    model: localStorage.getItem("sentai_model") || "",
  });

  const handleRefine = async () => {
    if (!activeDraft.draft) return;
    setIsLoading(true);
    const { provider, apiKey, model } = getAiConfig();
    let refinedText = "";
    try {
      const prompt = localStorage.getItem("sentai_additional_prompt") || "";

      refinedText = await refineEmail({
        ...activeDraft,
        provider,
        apiKey,
        model,
        prompt,
      });
      updateActiveDraft({ result: refinedText });
    } catch (error: any) {
      console.error("Error refining email:", error);
      onAiError(
        error instanceof Error
          ? error.message
          : "Errore durante la generazione dell'email.",
      );
      if (error.message.includes("Key non trovata")) {
        setIsSettingsOpen(true);
      }
      return;
    } finally {
      setIsLoading(false);
    }

    // Richiesta separata: non deve tenere bloccato lo skeleton del risultato appena raffinato.
    // Genera l'oggetto solo se richiesto e non ancora presente: non deve essere rigenerato ad ogni raffinazione.
    if (activeDraft.generateSubject && !activeDraft.subject) {
      setIsGeneratingSubject(true);
      try {
        const subject = await generateSubject({
          context: activeDraft.context,
          draft: activeDraft.draft,
          result: refinedText,
          language: activeDraft.language,
          provider,
          apiKey,
          model,
        });
        updateActiveDraft({ subject });
      } catch (error) {
        console.error("Error generating subject:", error);
        onAiError(
          error instanceof Error
            ? error.message
            : "Errore durante la generazione dell'oggetto.",
        );
      } finally {
        setIsGeneratingSubject(false);
      }
    }
  };

  const handleGenerateSubject = async () => {
    setIsGeneratingSubject(true);
    try {
      const { provider, apiKey, model } = getAiConfig();
      const subject = await generateSubject({
        context: activeDraft.context,
        draft: activeDraft.draft,
        result: activeDraft.result,
        language: activeDraft.language,
        provider,
        apiKey,
        model,
      });
      updateActiveDraft({ subject });
    } catch (error: any) {
      console.error("Error generating subject:", error);
      onAiError(
        error instanceof Error
          ? error.message
          : "Errore durante la generazione dell'oggetto.",
      );
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const handleModifyResult = async (instructions: string) => {
    if (!activeDraft.result || !instructions.trim()) return;
    setIsModifying(true);
    try {
      const { provider, apiKey, model } = getAiConfig();
      const revisedText = await reviseEmail({
        result: activeDraft.result,
        instructions,
        language: activeDraft.language,
        temperature: activeDraft.temperature,
        provider,
        apiKey,
        model,
      });
      updateActiveDraft({ result: revisedText });
    } catch (error: any) {
      console.error("Error modifying email:", error);
      onAiError(
        error instanceof Error
          ? error.message
          : "Errore durante la modifica dell'email.",
      );
    } finally {
      setIsModifying(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeDraft.result);
    alert("Email copiata negli appunti!");
  };

  const copySubjectToClipboard = () => {
    navigator.clipboard.writeText(activeDraft.subject);
    alert("Oggetto copiato negli appunti!");
  };

  const pasteFromClipboard = async (target: "context" | "draft") => {
    try {
      const text = await navigator.clipboard.readText();
      if (target === "context") {
        updateActiveDraft({
          context: activeDraft.context
            ? `${activeDraft.context}\n${text}`
            : text,
        });
      } else {
        updateActiveDraft({
          draft: activeDraft.draft ? `${activeDraft.draft}\n${text}` : text,
        });
      }
    } catch (error) {
      console.error("Error accessing clipboard:", error);
      alert(
        "Impossibile accedere agli appunti. Verifica i permessi del browser/pc.",
      );
    }
  };

  return {
    isLoading,
    isGeneratingSubject,
    isModifying,
    handleRefine,
    handleGenerateSubject,
    handleModifyResult,
    copyToClipboard,
    copySubjectToClipboard,
    pasteFromClipboard,
  };
};
