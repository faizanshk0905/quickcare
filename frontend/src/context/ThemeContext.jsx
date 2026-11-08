import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { i18n } = useTranslation();

  // Dark Mode / Light Mode Theme State
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('quickcare_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

  const [fontSize, setFontSize] = useState(localStorage.getItem('quickcare_font_size') || 'normal');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('quickcare_high_contrast') === 'true');
  const [textToSpeech, setTextToSpeech] = useState(localStorage.getItem('quickcare_tts') === 'true');
  const [language, setLanguageState] = useState(localStorage.getItem('quickcare_language') || 'en');

  // Synchronize Theme with Document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('quickcare_theme', theme);
  }, [theme]);

  // Apply font size class to document body
  useEffect(() => {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (fontSize === 'large') document.body.classList.add('font-large');
    if (fontSize === 'xlarge') document.body.classList.add('font-xlarge');
    localStorage.setItem('quickcare_font_size', fontSize);
  }, [fontSize]);

  // Apply high contrast class
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('quickcare_high_contrast', highContrast);
  }, [highContrast]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

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
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        fontSize,
        setFontSize,
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
