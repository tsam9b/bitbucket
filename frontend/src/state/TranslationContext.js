import React, { createContext, useContext, useState } from 'react';
import enTranslations from '../locales/en.json';

const TranslationContext = createContext();

/**
 * Get a nested value from an object using a dot-notation path
 * @param {Object} obj - The object to search
 * @param {string} path - Dot-notation path (e.g., 'messages.welcome.title')
 * @returns {string} The value at the path, or the path itself if not found
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the path as fallback if not found
    }
  }
  
  return current;
}

export function TranslationProvider({ children, locale = 'en' }) {
  const [translations] = useState(() => {
    // Currently only English is supported
    // Future locales can be added here
    return enTranslations;
  });

  /**
   * Translate a key to the current locale
   * @param {string} key - The translation key (e.g., 'messages.welcome.title')
   * @returns {string} The translated string, or the key if not found
   */
  const t = (key) => {
    return getNestedValue(translations, key);
  };

  return (
    <TranslationContext.Provider value={{ t, locale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
