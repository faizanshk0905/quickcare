import React from 'react';
import { HeartPulse, ShieldCheck, Video, Bot, Award, Users, CheckCircle } from 'lucide-react';

export const AboutUs = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
          Our Healthcare Mission
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Empowering Health with Smart, Accessible Telemedicine
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          QUICK CARE bridges the gap between patients and licensed healthcare professionals through secure online bookings, AI-assisted clinical triaging, WebRTC video consultations, and tamper-resistant digital prescriptions.
        </p>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Rigorous Verification</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every physician on QuickCare is validated through state medical councils and verified by our medical board before seeing patients.
          </p>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Confidential Telehealth</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our consultations run over peer-to-peer encrypted WebRTC connections with zero recording or storage of private medical conversations.
          </p>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Multilingual AI Triaging</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            QuickCare AI understands symptoms in English, Hindi, and Marathi, triaging emergencies safely and guiding patients to the correct specialty.
          </p>
        </div>
      </div>
    </div>
  );
};
