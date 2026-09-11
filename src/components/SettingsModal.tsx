import { X } from 'lucide-react';
import React from 'react';
import { getModels } from '../services/ai';

export const SettingsModal = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  modelName,
  setModelName,
  provider,
  setProvider,
  lmStudioUrl,
  setLmStudioUrl,
  onAiError,
  onSave,
  additionalPrompt,
  setAdditionalPrompt,
}: any) => {
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || (provider !== 'lmstudio' && !apiKey)) {
      setAvailableModels([]);
      return;
    }
    setIsLoadingModels(true);
    getModels(provider, apiKey, lmStudioUrl)
      .then(setAvailableModels)
      .catch((error) => {
        setAvailableModels([]);
        onAiError(error instanceof Error ? error.message : 'Impossibile caricare i modelli AI.');
      })
      .finally(() => setIsLoadingModels(false));
  }, [isOpen, provider, apiKey, lmStudioUrl, onAiError]);

  const options = availableModels.map((model) => (
    <option key={model} value={model}>
      {model}
    </option>
  ));

  const requiresApiKey = provider !== 'lmstudio';

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white">Impostazioni</h2>
            <button
              className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-300"
              type="button"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="provider-ai"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Provider AI
              </label>
              <select
                id="provider-ai"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="lmstudio">LM Studio (locale)</option>
              </select>
            </div>
            {provider === 'lmstudio' && (
              <div>
                <label
                  htmlFor="lmstudio-url"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  URL LM Studio
                </label>
                <input
                  id="lmstudio-url"
                  type="url"
                  value={lmStudioUrl}
                  onChange={(e) => setLmStudioUrl(e.target.value)}
                  placeholder="http://localhost:1234/v1"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="api-key"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                API Key {provider === 'lmstudio' && '(opzionale)'}
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Incolla qui la tua API Key..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-name"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Modello
              </label>
              <input
                id="model-name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                list="available-models"
                placeholder={isLoadingModels ? 'Caricamento modelli...' : 'Scrivi o seleziona un modello'}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <datalist id="available-models">{options}</datalist>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {provider === 'lmstudio'
                  ? 'I modelli installati vengono letti da LM Studio. Puoi anche inserire manualmente il model ID.'
                  : requiresApiKey && availableModels.length === 0
                    ? 'Inserisci la API key per caricare i modelli, oppure scrivi il modello manualmente.'
                    : 'Puoi selezionare un modello dall’elenco o inserirlo manualmente.'}
              </p>
            </div>
            <div>
              <label
                htmlFor="additional-prompt"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Prompt Aggiuntivo
              </label>
              <textarea
                id="additional-prompt"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="Istruzioni aggiuntive per l'AI..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Le credenziali vengono salvate solo nel tuo browser.
            </p>
          </div>
          <button
            className="cursor-pointer w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors"
            type="button"
            onClick={onSave}
          >
            Salva Impostazioni
          </button>
        </div>
      </div>
    )
  );
};
