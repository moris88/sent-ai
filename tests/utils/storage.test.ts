import { beforeEach, describe, expect, it } from 'vitest';
import { getLocalStorageSize, isLocalStorageApproachingLimit } from '../../src/utils/storage';

describe('storage size', () => {
  beforeEach(() => localStorage.clear());

  it('somma la lunghezza di chiavi e valori', () => {
    localStorage.setItem('abc', '12345');
    expect(getLocalStorageSize()).toBe(3 + 5);
  });

  it('segnala quando si supera la soglia', () => {
    localStorage.setItem('chiave', 'x'.repeat(100));

    expect(isLocalStorageApproachingLimit(50)).toBe(true);
    expect(isLocalStorageApproachingLimit(1000)).toBe(false);
  });
});
