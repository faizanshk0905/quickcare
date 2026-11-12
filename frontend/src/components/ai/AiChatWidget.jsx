import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { aiService, MANDATORY_MEDICAL_DISCLAIMER } from '../../services/aiService';
import {
  Bot,
  X,
  Send,
  Trash2,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  User,
  Volume2,
  Square,
  Mic,
  MicOff,
  ShieldCheck,
  Stethoscope,
  Info,
} from 'lucide-react';

/**
 * Formats clinical markdown text into styled, readable JSX elements
 */
const FormattedMedicalContent = ({ content }) => {
  if (!content) return null;

  // Separate mandatory disclaimer if present to render in a dedicated advisory card
  const disclaimerMarker = '⚕️ **Important Medical Advice:**';
  let mainBody = content;
  let disclaimerText = null;

  if (content.includes(disclaimerMarker)) {
    const parts = content.split(disclaimerMarker);
    mainBody = parts[0].trim().replace(/---\s*$/, '').trim();
    disclaimerText = `Important Medical Advice:${parts[1]}`.trim();
  }

  // Parse lines into structured headings, bullet points, and paragraphs
  const lines = mainBody.split('\n');

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-800 dark:text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Divider
        if (trimmed === '---') {
          return <hr key={idx} className="my-2 border-slate-200 dark:border-slate-700" />;
        }

        // Section Heading (###)
        if (trimmed.startsWith('###')) {
          const headingText = trimmed.replace(/^###\s*/, '');
          return (
            <h4
              key={idx}
              className="font-extrabold text-[13px] text-blue-700 dark:text-teal-400 mt-2 flex items-center gap-1.5"
            >
              {headingText}
            </h4>
          );
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const itemText = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              <span>{renderBoldSpans(itemText)}</span>
            </div>
          );
        }

        // Standard line / Bold item
        return (
          <p key={idx} className="leading-relaxed">
            {renderBoldSpans(trimmed)}
          </p>
        );
      })}

      {/* Dedicated Mandatory Medical Advice Card (Requirement 4) */}
      {disclaimerText && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50/90 to-teal-50/90 dark:from-slate-800/90 dark:to-slate-900/90 border border-blue-200/80 dark:border-teal-900/60 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-blue-800 dark:text-teal-300 font-extrabold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Important Medical Advice</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
            {disclaimerText.replace(/^Important Medical Advice:\s*/i, '').replace(/\*\*/g, '')}
          </p>
        </div>
      )}
    </div>
  );
};

function renderBoldSpans(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const AiChatWidget = () => {
  const { t } = useTranslation();
  const { language } = useTheme();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [contextualPills, setContextualPills] = useState([
    'Which doctors are available on our website?',
    'What is diabetes?',
    'What are the symptoms of dengue?',
    'Why am I experiencing chest pain?',
    'Which doctor should I consult for a skin infection?',
    'Suggest available doctors',
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        'Hello! I am QuickCare AI Healthcare Assistant.\n\nYou can ask me questions about any disease, illness, symptom, or health condition (e.g. dengue, diabetes, hypertension, asthma, thyroid, skin infections, arthritis, digestive issues, children’s health, or heart care). I will explain the condition, symptoms, causes, prevention, treatments, precautions, and recommend verified specialists when available.\n\n---\n\n' +
        MANDATORY_MEDICAL_DISCLAIMER,
      isEmergency: false,
      recommendedDoctors: [],
      suggestedSpecialization: null,
      specialistAvailable: true,
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Stop speech when navigating or closing
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [location.pathname]);

  const handleToggleSpeech = (idx, text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for smooth TTS reading
    const cleanText = text
      .replace(/[*#_~`•]/g, ' ')
      .replace(/⚕️/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

    utterance.onstart = () => setSpeakingIndex(idx);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice input error:', err);
      setIsListening(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
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
        text:
          'Chat history cleared. How else may I assist you with your health or disease-related questions today?\n\n---\n\n' +
          MANDATORY_MEDICAL_DISCLAIMER,
        isEmergency: false,
        recommendedDoctors: [],
        suggestedSpecialization: null,
        specialistAvailable: true,
      },
    ]);
  };

  const updateFollowUpPills = (query) => {
    const lower = (query || '').toLowerCase();
    if (lower.includes('dengue')) {
      setContextualPills([
        'What are warning signs of severe dengue?',
        'How to prevent mosquito bites?',
        'What foods help recovery in dengue?',
        'Which doctor treats dengue?',
      ]);
    } else if (lower.includes('diabet') || lower.includes('sugar')) {
      setContextualPills([
        'What is a normal HbA1c level?',
        'What diet is recommended for Type 2 diabetes?',
        'Early symptoms of high blood sugar',
        'Which doctor should I consult for diabetes?',
      ]);
    } else if (lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('bp')) {
      setContextualPills([
        'What foods lower blood pressure?',
        'How is Stage 1 hypertension managed?',
        'Signs of hypertensive crisis',
        'Book consultation with a cardiologist',
      ]);
    } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('eczema')) {
      setContextualPills([
        'Which doctor should I consult for a skin infection?',
        'Home care for eczema and dry skin',
        'When is a skin rash dangerous?',
        'Book appointment with Dr. Rajesh Kulkarni',
      ]);
    } else if (lower.includes('heart') || lower.includes('chest')) {
      setContextualPills([
        'Warning signs of a heart attack',
        'What is an ECG test used for?',
        'How to lower bad LDL cholesterol?',
        'Book consultation with Dr. Priya Deshmukh',
      ]);
    } else if (lower.includes('child') || lower.includes('baby') || lower.includes('pediat')) {
      setContextualPills([
        'Safe home care for infant fever',
        'When to take a child to the emergency room?',
        'How to manage colic in babies?',
        'Book appointment with Dr. Ananya Roy',
      ]);
    } else {
      setContextualPills([
        'What are common symptoms of this condition?',
        'What prevention methods are recommended?',
        'When should I seek medical attention?',
        'Which doctor should I consult?',
      ]);
    }
  };

  const handleSend = async (messageToSend = null) => {
    const text = messageToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    updateFollowUpPills(text);

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
          unavailableReasons: data.unavailableReasons || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text:
            'Sorry, our AI service is currently unavailable. If you have urgent health concerns, please consult a qualified healthcare provider directly.\n\n---\n\n' +
            MANDATORY_MEDICAL_DISCLAIMER,
          isEmergency: false,
          recommendedDoctors: [],
          specialistAvailable: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-teal-500 text-white font-bold shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
          aria-label="Open QuickCare AI Healthcare Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">Ask QuickCare AI</span>
        </button>
      )}

      {/* Main Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[480px] h-[640px] max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 p-4 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  QuickCare AI Healthcare Assistant
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  All Diseases • Clinical Guidance • Doctor Matching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 border-b border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="leading-tight">
                For life-threatening emergencies, call <strong>112 / 108</strong> in India immediately.
              </span>
            </div>
            <a
              href="tel:112"
              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0 flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" /> Call 112
            </a>
          </div>

          {/* Messages Scroll Area */}
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

                <div className="max-w-[88%] space-y-2">
                  {/* PROMINENT EMERGENCY WARNING BANNER (Requirement 5) */}
                  {m.isEmergency && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-100 text-xs shadow-md space-y-2.5 animate-pulse">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-black text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Critical Medical Emergency Warning</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">
                        {m.emergencyDisclaimer ||
                          'The symptoms described indicate an urgent life-threatening emergency. In India, please call 112 or 108 immediately or go to the nearest emergency department right away.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href="tel:112"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call 112 (National Emergency)</span>
                        </a>
                        <a
                          href="tel:108"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call 108 (Ambulance)</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-3xl text-xs leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md font-medium'
                        : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-bl-none text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.sender === 'assistant' ? (
                      <FormattedMedicalContent content={m.text} />
                    ) : (
                      <p className="whitespace-pre-line">{m.text}</p>
                    )}

                    {/* Speech / TTS Toggle */}
                    {m.sender === 'assistant' && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(idx, m.text)}
                          className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition cursor-pointer ${
                            speakingIndex === idx
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                          title={speakingIndex === idx ? 'Stop Reading' : 'Read Aloud (TTS)'}
                        >
                          {speakingIndex === idx ? (
                            <>
                              <Square className="w-3 h-3 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400" />
                              <span>Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen Aloud</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          QuickCare AI Medical Engine
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Unavailable Medical Specialty Warning with Detailed Reasons */}
                  {m.sender === 'assistant' &&
                    m.specialistAvailable === false &&
                    m.suggestedSpecialization &&
                    !m.isEmergency && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-3xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Specialty: {m.suggestedSpecialization}</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            Currently Unavailable
                          </span>
                        </div>

                        <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
                          Sorry, currently we don't have a doctor available for this medical specialty on the Quick Care website.
                        </p>

                        {/* Detailed Reasons Why Doctor is Unavailable */}
                        <div className="pt-2 border-t border-amber-200/70 dark:border-amber-900/40 space-y-2">
                          <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 block uppercase tracking-wider">
                            Why is a doctor not currently available on our website?
                          </span>
                          <ul className="space-y-1.5 text-[11px] text-amber-800 dark:text-amber-300/90 leading-snug">
                            {(m.unavailableReasons && m.unavailableReasons.length > 0
                              ? m.unavailableReasons
                              : [
                                  `Panel Onboarding in Progress: Quick Care currently features verified doctors in Cardiology, Dermatology, Pediatrics, and Orthopedics. Specialists in ${m.suggestedSpecialization} are undergoing clinical credentialing before joining our digital platform.`,
                                  `In-Person Diagnostic Safety Requirements: Conditions in this field typically require hands-on physical clinical examinations, diagnostic imaging (MRI/CT/Endoscopy), or lab tests that cannot be performed safely via telemedicine alone.`,
                                  `NMC Telemedicine Prescription Guidelines: Telehealth regulations restrict online prescription of specific controlled, high-potency, or acute medications without prior physical in-person clinical evaluation.`,
                                  `Specialist Shifts & Capacity: Any affiliated visiting specialists may currently be off-duty, performing surgeries, or all daily appointment slots may be occupied.`
                                ]
                            ).map((reasonText, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <span>{reasonText}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Quick Action: View Available Website Doctors */}
                        <div className="pt-2 border-t border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            Looking to consult one of our active doctors?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSend('Which doctors are available on our website?')}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-center"
                          >
                            View Available Doctors on Website
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Matching Verified Doctor Cards on Website */}
                  {m.recommendedDoctors && m.recommendedDoctors.length > 0 && !m.isEmergency && (
                    <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span>Doctor(s) Available on Quick Care Website</span>
                        </span>
                        {m.suggestedSpecialization && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                            {m.suggestedSpecialization}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {m.recommendedDoctors.map((doc) => (
                          <div
                            key={doc.doctorId}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-center justify-between gap-3 hover:border-blue-200 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  doc.profileImage ||
                                  (doc.gender?.toLowerCase() === 'female'
                                    ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'
                                    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100')
                                }
                                alt=""
                                className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-600 shadow-2xs"
                              />
                              <div className="truncate space-y-0.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {doc.fullName}
                                  </p>
                                  <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-sm border border-blue-100 shrink-0">
                                    Verified
                                  </span>
                                </div>
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                                  {doc.specialization} • {doc.experience || 10}+ yrs exp
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    Fee: ₹{doc.consultationFee}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    24/7 Video Available
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Link
                              to={`/doctors/${doc.doctorId}`}
                              onClick={handleClose}
                              className="px-3.5 py-2 text-xs font-black bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl shrink-0 transition active:scale-95 shadow-xs flex items-center gap-1"
                            >
                              <span>Book</span>
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

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs py-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1 font-medium">
                    QuickCare AI is formulating comprehensive medical guidance...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Follow-Up Suggestions / Pills (Requirement 3 & 7) */}
          <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar shrink-0">
            {contextualPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(pill)}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 transition whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-600 font-medium cursor-pointer shadow-2xs"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Message Input Bar with Voice Input (Requirement 7) */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input (Speak to ask)'}
                aria-label="Voice input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any disease, symptoms, causes, or doctors..."
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shrink-0 cursor-pointer active:scale-95"
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
