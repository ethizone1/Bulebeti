import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  // Try to load saved language, default to 'en'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'am' : 'en';
      localStorage.setItem('app_language', newLang);
      return newLang;
    });
  };

  // The translation function
  const t = (key) => {
    if (!translations[language]) return key;
    // Fallback to English if Amharic translation is missing
    return translations[language][key] || translations['en'][key] || key;
  };

  // Apply global background color based on language
  useEffect(() => {
    if (language === 'am') {
      document.body.style.backgroundColor = '#faf8f5'; // Subtle warm tint for Amharic
      document.documentElement.lang = 'am';
    } else {
      document.body.style.backgroundColor = 'var(--surface)'; // Default background
      document.documentElement.lang = 'en';
    }

    // Cleanup not strictly necessary as it will just be overridden, but good practice
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
