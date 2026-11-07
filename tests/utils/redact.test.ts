import { describe, expect, it, vi } from 'vitest';
import {
  createPrivacySession,
  findSensitiveData,
  notifyRedactions,
  subscribeToRedactions,
  withPrivacy,
} from '../../src/utils/redact';

const IBAN = 'IT60X0542811101000000123456';
const CODICE_FISCALE = 'RSSMRA85T10A562S';
const CARD = '4111111111111111';

describe('createPrivacySession', () => {
  it('oscura email, IBAN, codice fiscale, partita IVA e carta con segnaposto numerati', () => {
    const session = createPrivacySession();
    const text = `Mail mario.rossi@example.it, IBAN ${IBAN}, CF ${CODICE_FISCALE}, P.IVA 12345678901, carta ${CARD}`;

    const redacted = session.redact(text);

    expect(redacted).toContain('[EMAIL_1]');
    expect(redacted).toContain('[IBAN_1]');
    expect(redacted).toContain('[CODICE_FISCALE_1]');
    expect(redacted).toContain('[PARTITA_IVA_1]');
    expect(redacted).toContain('[CARTA_1]');
    expect(redacted).not.toContain('mario.rossi@example.it');
    expect(redacted).not.toContain(IBAN);
  });

  it('oscura password e token con etichetta, lasciando visibile l etichetta', () => {
    const session = createPrivacySession();
    const redacted = session.redact('password: Hunter2! e api_key: XYZ987654321');

    expect(redacted).toBe('password: [PASSWORD_1] e api_key: [TOKEN_1]');
  });

  it('riconosce chiavi con prefisso noto e il token dopo Bearer', () => {
    const session = createPrivacySession();
    const redacted = session.redact(
      'usa sk-abcdefghijklmnop1234 e Authorization: Bearer abcdefghijklmnopqrstuv'
    );

    expect(redacted).toContain('[TOKEN_1]');
    expect(redacted).toContain('[TOKEN_2]');
    expect(redacted).not.toContain('abcdefghijklmnopqrstuv');
  });

  it('non oscura un numero di carta che non supera il controllo Luhn', () => {
    const session = createPrivacySession();
    const text = '4111111111111112';

    expect(session.redact(text)).not.toContain('[CARTA_');
  });

  it('riporta lo stesso valore con lo stesso segnaposto e ripristina il testo originale', () => {
    const session = createPrivacySession();
    const text = 'Scrivi a mario.rossi@example.it, ripeto mario.rossi@example.it';

    const redacted = session.redact(text);

    expect(redacted.match(/\[EMAIL_1\]/g)).toHaveLength(2);
    expect(session.restore(redacted)).toBe(text);
  });

  it('restituisce testo vuoto senza modifiche', () => {
    const session = createPrivacySession();
    expect(session.redact('')).toBe('');
    expect(session.restore('')).toBe('');
    expect(session.summary()).toEqual({});
  });

  it('conta i valori distinti per tipo nel riepilogo', () => {
    const session = createPrivacySession();
    session.redact('a@example.it, b@example.it, a@example.it');

    expect(session.summary()).toEqual({ EMAIL: 2 });
  });

  it('lascia intatti i segnaposto non riconosciuti da restore', () => {
    const session = createPrivacySession();
    expect(session.restore('Ciao [EMAIL_9]')).toBe('Ciao [EMAIL_9]');
  });
});

describe('findSensitiveData', () => {
  it('conta i dati presenti senza modificare il testo', () => {
    expect(findSensitiveData(`x@example.it ${CARD}`)).toEqual({ EMAIL: 1, CARTA: 1 });
  });
});

describe('withPrivacy', () => {
  it('oscura i campi testuali, salta provider/apiKey/model e ripristina il risultato', async () => {
    const received: Record<string, unknown>[] = [];
    const fn = vi.fn(async (options: Record<string, unknown>) => {
      received.push(options);
      return `Risposta per ${String(options.draft)}`;
    });
    const wrapped = withPrivacy(fn);

    const result = await wrapped({
      provider: 'gemini',
      apiKey: 'chiave',
      model: 'modello',
      draft: 'Scrivi a mario.rossi@example.it',
    });

    expect(received[0].draft).toBe('Scrivi a [EMAIL_1]');
    expect(received[0].provider).toBe('gemini');
    expect(received[0].apiKey).toBe('chiave');
    expect(result).toBe('Risposta per Scrivi a mario.rossi@example.it');
  });

  it('notifica gli ascoltatori con i campi effettivamente inviati', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToRedactions(listener);
    const wrapped = withPrivacy(async () => 'ok');

    await wrapped({ draft: 'Chiama 3331234567', context: '' });

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0];
    expect(event.summary).toEqual({ TELEFONO: 1 });
    expect(event.sentFields).toEqual([
      { field: 'draft', text: 'Chiama [TELEFONO_1]' },
      { field: 'context', text: '' },
    ]);
    unsubscribe();
  });

  it('non notifica quando non c è nulla da oscurare', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToRedactions(listener);

    notifyRedactions({ summary: {}, sentFields: [] });

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('smette di notificare dopo l annullamento della sottoscrizione', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToRedactions(listener);
    unsubscribe();

    notifyRedactions({ summary: { EMAIL: 1 }, sentFields: [] });

    expect(listener).not.toHaveBeenCalled();
  });
});
