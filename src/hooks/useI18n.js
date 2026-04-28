import { useState, useCallback, useEffect } from 'react';
import { translations } from '../logic/i18n';

export const useI18n = () => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('logido_lang');
    if (saved) return saved;
    return navigator.language.startsWith('ja') ? 'ja' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('logido_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((keyPath, replacements = {}) => {
    const keys = keyPath.split('.');
    let value = translations[lang];
    
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        return keyPath; // Fallback to key name if not found
      }
    }

    if (typeof value === 'string') {
      let result = value;
      Object.entries(replacements).forEach(([k, v]) => {
        result = result.replace(`[${k}]`, v);
      });
      return result;
    }

    return keyPath;
  }, [lang]);

  return { t, lang, setLang };
};
