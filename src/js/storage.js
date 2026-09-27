/**
 * Storage Manager for Lunch Finder
 * Handles reading and writing persistent state to localStorage.
 */

const STORAGE_KEYS = {
  DIETARY: 'lunch_finder_dietary',
  GOOGLE_API_KEY: 'lunch_finder_google_api_key',
  LAST_LOCATION: 'lunch_finder_last_location'
};

export const Storage = {
  /**
   * Get array of saved dietary preference IDs
   * @returns {string[]}
   */
  getDietaryPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DIETARY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading dietary preferences from storage:', e);
      return [];
    }
  },

  /**
   * Save dietary preferences array
   * @param {string[]} preferences 
   */
  saveDietaryPreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEYS.DIETARY, JSON.stringify(preferences || []));
    } catch (e) {
      console.error('Error saving dietary preferences to storage:', e);
    }
  },

  /**
   * Get custom Google Maps API key if stored or configured
   * @returns {string}
   */
  getGoogleApiKey() {
    if (window.LUNCH_FINDER_CONFIG && window.LUNCH_FINDER_CONFIG.GOOGLE_MAPS_API_KEY) {
      return window.LUNCH_FINDER_CONFIG.GOOGLE_MAPS_API_KEY.trim();
    }
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_API_KEY) || '';
  },

  /**
   * Save custom Google Maps API key
   * @param {string} key 
   */
  saveGoogleApiKey(key) {
    if (key) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_API_KEY);
    }
  },

  /**
   * Save last used location object { name, lat, lng }
   */
  saveLastLocation(location) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(location));
    } catch (e) {
      console.error('Error saving last location:', e);
    }
  },

  /**
   * Get last used location object
   */
  getLastLocation() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
};
