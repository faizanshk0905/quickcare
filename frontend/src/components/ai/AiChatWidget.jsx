import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { aiService } from '../../services/aiService';
import {
  Bot,
  X,
  Send,
  Trash2,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  User,
  ArrowRight,
  Volume2,
  Square,
  Minimize2,
} from 'lucide-react';

export const AiChatWidget = () => {
  const { t } = useTranslation();
  const { language, isDark } = useTheme();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        language === 'hi'
          ? 'नमस्ते! मैं क्विककेयर एआई स्वास्थ्य सहायक हूं। आप विभिन्न बीमारियों (जैसे मधुमेह, उच्च रक्तचाप, हृदय रोग, त्वचा रोग, अस्थमा), उनके लक्षण, दवाइयां, जांच या किसी भी स्वास्थ्य प्रश्न के बारे में पूछ सकते हैं।'
          : language === 'mr'
          ? 'नमस्कार! मी क्विककेअर एआई आरोग्य सहाय्यक आहे. आपण कोणत्याही आजारांबद्दल (उदा. मधुमेह, उच्च रक्तदाब, हृदयरोग, त्वचारोग, दमा), त्यांची लक्षणे, औषधे, तपासण्या किंवा वैद्यकीय सल्ल्याबद्दल विचारू शकता.'
          : 'Hello! I am QuickCare AI Assistant. You can ask me any health or disease-related questions (e.g. diabetes, hypertension, heart disease, skin conditions, asthma, first aid, diagnostic tests), describe your symptoms, or find verified specialists at Quick Care.',
      isEmergency: false,
      recommendedDoctors: [],
      suggestedSpecialization: null,
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Stop speech when navigating to another page or unmounting
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
  }, [location.pathname]);

  const handleToggleSpeech = (idx, text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // If currently speaking this message: stop immediately
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    // If speaking any other message or inactive: cancel previous and start current
    window.speechSynthesis.cancel();

    // Clean text: strip markdown symbols (*, #, _, •) for smooth synthesized speech
    const cleanText = text
      .replace(/[*#_~`•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';

    utterance.onstart = () => {
      setSpeakingIndex(idx);
    };

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    setIsOpen(false);
  };

  const clearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    setMessages([
      {
        sender: 'assistant',
        text: 'Chat cleared. How else may I assist you with your health or disease-related questions today?',
        isEmergency: false,
        recommendedDoctors: [],
      },
    ]);
  };

  const handleSend = async (messageToSend = null) => {
    const text = messageToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(text, language, conversationId);
      if (res && res.data) {
        const data = res.data;
        if (data.conversationId) setConversationId(data.conversationId);

        const assistantMsg = {
          sender: 'assistant',
          text: data.reply,
          isEmergency: data.emergency,
          emergencyDisclaimer: data.emergencyDisclaimer,
          suggestedSpecialization: data.suggestedSpecialization,
          specialistAvailable: data.specialistAvailable,
          recommendedDoctors: data.recommendedDoctors || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text:
            'Sorry, our AI service is experiencing high demand. Please try again or consult our verified specialists directly.',
          isEmergency: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPills = [
    'What causes diabetes and how is it managed?',
    'What are common symptoms of hypertension?',
    'Chest discomfort and shortness of breath',
    'Diet and lifestyle tips for heart health',
    'Child has high fever and sore throat',
    'What are warning signs of migraine?',
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-teal-500 text-white font-semibold shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
          aria-label="Open QuickCare AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-sm tracking-wide hidden sm:inline">Ask QuickCare AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[460px] h-[620px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  QuickCare AI Clinical Assistant
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Healthcare & Disease Intelligence • Doctor Matching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 border-b border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="leading-tight">
              Informational tool. For severe emergencies, call <strong>108 / 112</strong> immediately.
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-slate-950/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  {/* Emergency Banner */}
                  {m.isEmergency && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs shadow-xs animate-pulse">
                      <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        CRITICAL MEDICAL EMERGENCY WARNING
                      </p>
                      <p className="mt-1 leading-relaxed text-[11px]">{m.emergencyDisclaimer}</p>
                      <a
                        href="tel:108"
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-700 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call Emergency (108 / 112)
                      </a>
                    </div>
                  )}

                  {/* Bubble text */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* READ ALOUD TOGGLE BUTTON */}
                    {m.sender === 'assistant' && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(idx, m.text)}
                          className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            speakingIndex === idx
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                          title={speakingIndex === idx ? 'Stop Reading' : 'Read Aloud'}
                          aria-label={speakingIndex === idx ? 'Stop Reading' : 'Read Aloud'}
                        >
                          {speakingIndex === idx ? (
                            <>
                              <Square className="w-3 h-3 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400" />
                              <span>Stop Reading</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Read Aloud</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {language.toUpperCase()} Voice
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notice when specialist is not available at Quick Care */}
                  {m.sender === 'assistant' && m.specialistAvailable === false && m.suggestedSpecialization && !m.isEmergency && (
                    <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Specialist Not Available at Quick Care</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                        Currently, we do not have a doctor specializing in <strong>{m.suggestedSpecialization}</strong> at Quick Care Hospital. Please check again later or consult an appropriate healthcare provider.
                      </p>
                    </div>
                  )}

                  {/* Specialization & Recommended Doctors */}
                  {m.recommendedDoctors && m.recommendedDoctors.length > 0 && (
                    <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Suggested Specialists
                        </span>
                        {m.suggestedSpecialization && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-full">
                            {m.suggestedSpecialization}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {m.recommendedDoctors.map((doc) => (
                          <div
                            key={doc.doctorId}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={
                                  doc.profileImage ||
                                  (doc.gender?.toLowerCase() === 'female'
                                    ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'
                                    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100')
                                }
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {doc.fullName}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {doc.specialization} • ₹{doc.consultationFee}
                                </p>
                              </div>
                            </div>
                            <Link
                              to={`/doctors/${doc.doctorId}`}
                              onClick={() => {
                                handleClose();
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0 transition"
                            >
                              Book
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs py-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                    Analyzing clinical query...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Questions */}
          {messages.length <= 2 && (
            <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
              {suggestedPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(pill)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition whitespace-nowrap shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about diseases, symptoms, tests, or doctors..."
                className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-sm shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
