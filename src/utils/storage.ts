/**
 * Calculates the total characters stored in window.localStorage.
 * @returns {number} The total number of UTF-16 characters stored.
 */
export const getLocalStorageSize = (): number => {
  let totalChars = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key) {
      totalChars += key.length + (window.localStorage.getItem(key)?.length || 0);
    }
  }
  return totalChars;
};

/**
 * Checks if the total size of localStorage is approaching the browser limit.
 * Default threshold is 4MB (80% of typical 5MB limit).
 * @param {number} threshold - The threshold in characters/bytes.
 * @returns {boolean} True if total characters exceed threshold.
 */
export const isLocalStorageApproachingLimit = (threshold = 4 * 1024 * 1024): boolean => {
  return getLocalStorageSize() > threshold;
};
