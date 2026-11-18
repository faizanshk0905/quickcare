import React from 'react';
import { Link } from 'react-router-dom';
import { FaqSection } from '../../components/common/FaqSection';
import { ArrowLeft, PhoneCall, ShieldAlert, HeartPulse, Sparkles } from 'lucide-react';

export const FaqPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Emergency Alert Mini Banner inside FAQ page */}
        <div className="max-w-3xl mx-auto mb-10 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-rose-900 block">Emergency Helpline Notice</span>
              <span className="text-rose-700 text-[11px]">
                QuickCare is for outpatient telemedicine. In a life-threatening crisis, call 108 or 112 immediately.
              </span>
            </div>
          </div>
          <a
            href="tel:108"
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 108 Ambulance</span>
          </a>
        </div>

        {/* FAQ Section */}
        <FaqSection
          title="QuickCare Help Center & FAQ"
          subtitle="Clear answers about video consultations, prescriptions, doctor credentials, and medical reports."
        />
      </div>
    </div>
  );
};
