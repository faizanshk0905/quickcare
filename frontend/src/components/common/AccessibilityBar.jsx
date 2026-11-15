import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { Eye, Volume2, VolumeX, Globe } from 'lucide-react';

export const AccessibilityBar = () => {
  const { t } = useTranslation();
  const {
    highContrast,
    setHighContrast,
    textToSpeech,
    setTextToSpeech,
    language,
    changeLanguage,
    speak,
  } = useTheme();

  const toggleTts = () => {
    const next = !textToSpeech;
    setTextToSpeech(next);
    if (next) {
      speak('Text to speech enabled');
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs py-1 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Language:</span>
          </span>
          <div className="flex items-center gap-1.5 font-medium">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-0.5 rounded transition ${
                language === 'en' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => changeLanguage('hi')}
              className={`px-2 py-0.5 rounded transition ${
                language === 'hi' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => changeLanguage('mr')}
              className={`px-2 py-0.5 rounded transition ${
                language === 'mr' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Accessibility controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
              highContrast ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
            title="Toggle High Contrast"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Contrast</span>
          </button>

          <button
            onClick={toggleTts}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
              textToSpeech ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
            title="Screen Reader / Read Aloud"
          >
            {textToSpeech ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">TTS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
