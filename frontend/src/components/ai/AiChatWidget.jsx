import React, { useState, useRef, useEffect } from 'react';
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
  Minimize2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AiChatWidget = () => {
  const { t } = useTranslation();
  const { language, speak } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        language === 'hi'
          ? 'नमस्ते! मैं क्विककेयर एआई स्वास्थ्य सहायक हूं। आप अपने लक्षण बता सकते हैं, जैसे सिरदर्द, बुखार, त्वचा की समस्याएं या जोड़ों का दर्द।'
          : language === 'mr'
          ? 'नमस्कार! मी क्विककेअर एआई आरोग्य सहाय्यक आहे. तुम्ही तुमची लक्षणे मला सांगू शकता, जसे की ताप, पाठदुखी किंवा इतर त्रास.'
          : 'Hello! I am QuickCare AI Assistant. Describe your symptoms (e.g. chest discomfort, rash, joint pain, or persistent cough) to receive clinical guidance and doctor recommendations.',
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
        if (assistantMsg.isEmergency) {
          speak('Warning: Symptoms may require immediate emergency medical attention.');
        }
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

  const clearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: 'Chat cleared. How else may I assist you with your health today?',
        isEmergency: false,
        recommendedDoctors: [],
      },
    ]);
  };

  const suggestedPills = [
    'Mild chest heaviness after walking',
    'Red itchy skin rash on arms',
    'Severe back and knee joint pain',
    'Child has high fever & throat pain',
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-teal-500 text-white font-semibold shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all group"
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
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  QuickCare AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Clinical Triaging & Doctor Referral
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="bg-amber-50 px-3.5 py-1.5 border-b border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="leading-tight">
              Informational tool. For severe emergencies, call <strong>108 / 112</strong> immediately.
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
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

                <div className={`max-w-[85%] space-y-2`}>
                  {/* Emergency Banner */}
                  {m.isEmergency && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs shadow-xs animate-pulse">
                      <p className="font-bold flex items-center gap-1.5 text-rose-700">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        CRITICAL SYMPTOM ALERT
                      </p>
                      <p className="mt-1 leading-relaxed text-[11px]">{m.emergencyDisclaimer}</p>
                      <a
                        href="tel:108"
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-700 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call Emergency (108)
                      </a>
                    </div>
                  )}

                  {/* Bubble text */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.sender === 'assistant' && (
                      <button
                        onClick={() => speak(m.text)}
                        className="mt-2 text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3" /> Read aloud
                      </button>
                    )}
                  </div>

                  {/* Notice when specialist is not available at Quick Care */}
                  {m.sender === 'assistant' && m.specialistAvailable === false && m.suggestedSpecialization && !m.isEmergency && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Specialist Not Available at Quick Care</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Our hospital does not currently have a doctor specializing in <strong>{m.suggestedSpecialization}</strong>. Please consult an external healthcare facility for this department.
                      </p>
                    </div>
                  )}

                  {/* Specialization & Recommended Doctors */}
                  {m.recommendedDoctors && m.recommendedDoctors.length > 0 && (
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          Suggested Specialists
                        </span>
                        {m.suggestedSpecialization && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 rounded-full">
                            {m.suggestedSpecialization}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {m.recommendedDoctors.map((doc) => (
                          <div
                            key={doc.doctorId}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={
                                  doc.profileImage ||
                                  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'
                                }
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {doc.fullName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {doc.specialization} • ₹{doc.consultationFee}
                                </p>
                              </div>
                            </div>
                            <Link
                              to={`/doctors/${doc.doctorId}`}
                              onClick={() => setIsOpen(false)}
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
                  <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
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
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                  <span className="text-[11px] text-slate-500 ml-1">Analyzing symptoms...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Questions */}
          {messages.length <= 2 && (
            <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              {suggestedPills.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(pill)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full whitespace-nowrap transition"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ai.placeholder')}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
