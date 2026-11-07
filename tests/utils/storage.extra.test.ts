import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLocalStorageSize, isLocalStorageApproachingLimit } from '../../src/utils/storage';

describe('storage (rami aggiuntivi)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('ignora chiavi nulle e valori mancanti', () => {
    localStorage.setItem('a', 'bb');
    vi.spyOn(Storage.prototype, 'key').mockImplementation((i: number) => (i === 0 ? null : 'z'));
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'length', 'get').mockReturnValue(2);
    expect(getLocalStorageSize()).toBe(1);
  });

  it('usa la soglia predefinita di 4MB', () => {
    localStorage.setItem('k', 'v');
    expect(isLocalStorageApproachingLimit()).toBe(false);
  });
});
