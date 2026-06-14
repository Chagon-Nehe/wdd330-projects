/**
 * Clinical Research Hub - Persistent Browser Storage Engine (ES Module)
 */
export const StorageEngine = {
  /**
   * Safely retrieves and parses a JSON object from localStorage
   * @param {string} key - The browser storage key
   * @returns {*} Parsed data object, array, or null if empty/invalid
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`StorageEngine Error reading key "${key}":`, error);
      return null;
    }
  },

  /**
   * Converts data to a JSON string and commits it to localStorage
   * @param {string} key - The browser storage key
   * @param {*} value - The data structure to save
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`StorageEngine Error writing key "${key}":`, error);
    }
  },

  /**
   * Permanently drops a key-value record out of storage
   * @param {string} key - The browser storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`StorageEngine Error removing key "${key}":`, error);
    }
  },
};
