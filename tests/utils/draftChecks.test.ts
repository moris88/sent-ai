import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadForbiddenTerms,
  runLocalChecks,
  saveForbiddenTerms,
} from '../../src/utils/draftChecks';

const GOOD_BODY = `Gentile Mario,
vi scrivo per confermare l'appuntamento di domani alle dieci e per chiedere il materiale necessario alla riunione di lunedì.

Cordiali saluti,
Maurizio`;

const ids = (issues: { id: string }[]) => issues.map((issue) => issue.id);

describe('runLocalChecks', () => {
  beforeEach(() => localStorage.clear());

  it('non segnala problemi su una bozza corretta', () => {
    expect(runLocalChecks({ subject: 'Appuntamento di domani', draft: GOOD_BODY })).toEqual([]);
  });

  it('segnala dati personali ancora in chiaro', () => {
    const issues = runLocalChecks({
      subject: 'Dati',
      draft: `Gentile Mario,\n${GOOD_BODY.split('\n').slice(1).join('\n')}\nIl mio indirizzo è mario@example.it`,
    });

    expect(ids(issues)).toContain('sensitive-EMAIL');
    expect(issues.find((i) => i.id === 'sensitive-EMAIL')?.severity).toBe('warning');
  });

  it('segnala segnaposto da compilare come errore', () => {
    const issues = runLocalChecks({ subject: 'Oggetto', draft: `${GOOD_BODY} [Nome]` });

    expect(issues.find((i) => i.id === 'placeholders')?.severity).toBe('error');
  });

  it('segnala oggetto mancante, troppo lungo o tutto maiuscolo', () => {
    expect(ids(runLocalChecks({ subject: '  ', draft: GOOD_BODY }))).toContain('subject-missing');
    expect(ids(runLocalChecks({ subject: 'x'.repeat(71), draft: GOOD_BODY }))).toContain(
      'subject-long'
    );
    expect(ids(runLocalChecks({ subject: 'OGGETTO TUTTO MAIUSCOLO', draft: GOOD_BODY }))).toContain(
      'subject-uppercase'
    );
  });

  it('segnala bozza vuota e bozza breve', () => {
    expect(ids(runLocalChecks({ subject: 'Ok', draft: '   ' }))).toContain('body-empty');
    expect(ids(runLocalChecks({ subject: 'Ok', draft: 'Ciao' }))).toContain('body-short');
  });

  it('segnala saluto e chiusura mancanti', () => {
    const issues = ids(
      runLocalChecks({
        subject: 'Ok',
        draft:
          'Vi scrivo per una questione che riguarda il progetto e per fissare una call entro la prossima settimana con il team.',
      })
    );

    expect(issues).toContain('greeting-missing');
    expect(issues).toContain('closing-missing');
  });

  it('segnala punti esclamativi, urla e frasi molto lunghe', () => {
    const shouting = 'AVVISO IMPORTANTE URGENTE QUI';
    const longSentence = Array.from({ length: 40 }, () => 'parola').join(' ');
    const issues = ids(
      runLocalChecks({
        subject: 'Ok',
        draft: `Gentile Mario, ${shouting}! Grazie!! Davvero!!! ${longSentence}. Cordiali saluti`,
      })
    );

    expect(issues).toEqual(expect.arrayContaining(['exclamations', 'shouting', 'long-sentences']));
  });

  it('segnala i termini da evitare salvati nelle impostazioni', () => {
    saveForbiddenTerms('urgentissimo, Sinergia');

    const issues = runLocalChecks({
      subject: 'Ok',
      draft: `${GOOD_BODY} Ci sentiamo in sinergia.`,
    });

    expect(issues.some((i) => i.message.includes('"Sinergia"'))).toBe(true);
  });
});

describe('gestione dei termini da evitare', () => {
  beforeEach(() => localStorage.clear());

  it('separa i termini, ignora gli spazi vuoti e salva nel localStorage', () => {
    saveForbiddenTerms(' uno , , due ');

    expect(loadForbiddenTerms()).toEqual(['uno', 'due']);
  });

  it('restituisce un elenco vuoto se non c è nulla salvato', () => {
    expect(loadForbiddenTerms()).toEqual([]);
  });
});
