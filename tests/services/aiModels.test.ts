import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getModels, querySavedEmails } from '../../src/services/ai';

const mocks = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock('openai', () => ({
  default: class {
    models = { list: mocks.list };
  },
}));

vi.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: class {} }));

const fetchMock = vi.fn<typeof fetch>();
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe('normalizzazione URL di LM Studio', () => {
  it.each([
    ['http://host:1234', 'http://host:1234/api/v1'],
    ['http://host:1234/', 'http://host:1234/api/v1'],
    ['http://host:1234/v1', 'http://host:1234/api/v1'],
    ['http://host:1234/api/v1', 'http://host:1234/api/v1'],
    ['http://host:1234/api/v1/chat', 'http://host:1234/api/v1'],
    ['http://host:1234/v1/chat/completions', 'http://host:1234/api/v1'],
    ['http://host:1234/api/v1/models/', 'http://host:1234/api/v1'],
    ['  http://host:1234/v1/models  ', 'http://host:1234/api/v1'],
  ])('normalizza %s', async (input, expected) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    await getModels('lmstudio', '', input);
    expect(fetchMock).toHaveBeenCalledWith(`${expected}/models`);
  });

  it("usa l'URL salvato in sentai_lmstudio_url", async () => {
    localStorage.setItem('sentai_lmstudio_url', 'http://salvato:9999/v1');
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    await getModels('lmstudio', '');
    expect(fetchMock).toHaveBeenCalledWith('http://salvato:9999/api/v1/models');
  });

  it("usa l'URL salvato anche per le richieste di chat", async () => {
    localStorage.setItem('sentai_lmstudio_url', 'http://salvato:9999');
    fetchMock.mockResolvedValueOnce(jsonResponse({ output: 'ok' }));
    await querySavedEmails({
      question: 'q',
      emails: 'e',
      provider: 'lmstudio',
      apiKey: '',
      model: 'm',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('http://salvato:9999/api/v1/chat');
  });

  it('usa localhost come predefinito', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await getModels('lmstudio', '');
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234/api/v1/models');
  });
});

describe('getModels per LM Studio', () => {
  it('mappa gli elementi in base ai campi disponibili', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: ['testo', { id: 'a' }, { name: 'b' }, { model_instance_id: 'c' }, {}],
      })
    );
    expect(await getModels('lmstudio', '')).toEqual(['testo', 'a', 'b', 'c', '[object Object]']);
  });

  it('legge anche il campo models', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ models: [{ id: 'x' }] }));
    expect(await getModels('lmstudio', '')).toEqual(['x']);
  });

  it('restituisce una lista vuota se la risposta non è un array', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: 'nulla' }));
    expect(await getModels('lmstudio', '')).toEqual([]);
  });

  it('usa il messaggio di errore del server', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { message: 'vietato' } }, 403));
    await expect(getModels('lmstudio', '')).rejects.toThrow('vietato');
  });

  it('usa un messaggio generico con lo stato HTTP', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(getModels('lmstudio', '')).rejects.toThrow(
      "LM Studio ha restituito l'errore 500."
    );
  });

  it('converte gli errori non standard in un messaggio leggibile', async () => {
    fetchMock.mockRejectedValueOnce('rete');
    await expect(getModels('lmstudio', '')).rejects.toThrow('Impossibile raggiungere LM Studio.');
  });
});

describe('getModels per OpenAI', () => {
  it('esclude i modelli non testuali', async () => {
    mocks.list.mockResolvedValueOnce({
      data: [
        { id: 'gpt-4o' },
        { id: 'text-embedding-3' },
        { id: 'whisper-1' },
        { id: 'dall-e-3' },
        { id: 'gpt-4o-realtime' },
        { id: 'o3' },
      ],
    });
    expect(await getModels('openai', 'k')).toEqual(['gpt-4o', 'o3']);
  });
});

describe('getModels per Gemini', () => {
  it('tiene solo i modelli che generano contenuti', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        models: [
          { name: 'models/gemini-pro', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/embedding', supportedGenerationMethods: ['embedContent'] },
          { name: 'models/senza-metodi' },
        ],
      })
    );
    expect(await getModels('gemini', 'chiave')).toEqual(['gemini-pro']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models?key=chiave'
    );
  });

  it.each([
    [{ error: { message: 'chiave non valida' } }, 'chiave non valida'],
    [{}, "Google Gemini ha restituito l'errore 400."],
  ])('propaga gli errori HTTP (%j)', async (body, message) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(jsonResponse(body, 400));
    await expect(getModels('gemini', 'k')).rejects.toThrow(message);
    expect(consoleError).toHaveBeenCalled();
  });
});
