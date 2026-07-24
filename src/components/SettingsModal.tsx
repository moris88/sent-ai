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
  onSave,
}: any) => {
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);

  React.useEffect(() => {
    getModels(provider, apiKey).then((models) => {
      console.log('Available models:', models);
      setAvailableModels(models);
    });
  }, [provider, apiKey]);

  const options = availableModels.map((model) => (
    <option key={model} value={model}>
      {model}
    </option>
  ));

  const disabledOptions = availableModels.length === 0 || !apiKey;

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white">Impostazioni</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
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
              </select>
            </div>
            <div>
              <label
                htmlFor="api-key"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                API Key
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
              <select
                id="model-name"
                disabled={disabledOptions}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                {options}
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Le credenziali vengono salvate solo nel tuo browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onSave}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors"
          >
            Salva Impostazioni
          </button>
        </div>
      </div>
    )
  );
};
