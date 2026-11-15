import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { i18n } = useTranslation();

  const [highContrast, setHighContrast] = useState(localStorage.getItem('quickcare_high_contrast') === 'true');
  const [textToSpeech, setTextToSpeech] = useState(localStorage.getItem('quickcare_tts') === 'true');
  const [language, setLanguageState] = useState(localStorage.getItem('quickcare_language') || 'en');

  // Enforce consistent light theme and standard font scale permanently; clean up legacy keys/classes
  useEffect(() => {
    try {
      localStorage.removeItem('quickcare_theme');
      localStorage.removeItem('quickcare_font_size');
      if (document.documentElement) {
        document.documentElement.classList.remove('dark');
      }
      if (document.body) {
        document.body.classList.remove('dark', 'font-large', 'font-xlarge');
      }
    } catch (e) {}
  }, []);

  // Apply high contrast class
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('quickcare_high_contrast', highContrast);
  }, [highContrast]);

  const changeLanguage = (lang) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('quickcare_language', lang);
  };

  const speak = (text) => {
    if (!textToSpeech || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        isDark: false,
        toggleTheme: () => {},
        setTheme: () => {},
        fontSize: 'normal',
        setFontSize: () => {},
        highContrast,
        setHighContrast,
        textToSpeech,
        setTextToSpeech,
        language,
        changeLanguage,
        speak,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
