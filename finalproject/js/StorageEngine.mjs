/**
 * Unified Asynchronous Local Client Cache Interface Module
 */
export const StorageEngine = {
  /**
   * Store and stringify a deep state configuration payload object
   * @param {string} key
   * @param {Object|Array} data
   */
  async set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Storage write operational anomaly:", e);
      return false;
    }
  },

  /**
   * Retrieve and unpack data strings back to model arrays/objects
   * @param {string} key
   */
  async get(key) {
    try {
      const payload = localStorage.getItem(key);
      return payload ? JSON.parse(payload) : null;
    } catch (e) {
      console.error("Storage fetch parsing variance:", e);
      return null;
    }
  },

  /**
   * Wipe a targeted storage partition sector clear
   * @param {string} key
   */
  async clear(key) {
    localStorage.removeItem(key);
    return true;
  },
};
