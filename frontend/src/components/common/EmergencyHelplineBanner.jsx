import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  X,
  Phone,
  ShieldAlert,
  HeartPulse,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

export const EmergencyHelplineBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(null);

  const emergencyContacts = [
    {
      service: 'National Emergency Ambulance',
      number: '108',
      desc: 'Free 24/7 emergency medical response, trauma & critical patient transport',
      type: 'critical',
      alt: '102',
    },
    {
      service: 'Unified Emergency Services (Police / Fire / Med)',
      number: '112',
      desc: 'All-in-one national emergency helpline (equivalent to 911 / 999)',
      type: 'critical',
    },
    {
      service: 'National Health Helpline (MoHFW)',
      number: '1800-180-1104',
      desc: 'Toll-free government medical advice, public hospital queries & guidance',
      type: 'info',
    },
    {
      service: 'Tele-MANAS Mental Health Helpline',
      number: '14416',
      desc: '24/7 free comprehensive psychiatric counselling, stress & crisis support',
      type: 'info',
      alt: '1800-891-4416',
    },
    {
      service: 'National Poison Information Centre (AIIMS)',
      number: '1800-116-117',
      desc: 'Immediate clinical toxicology advice for toxic ingestion or snake bites',
      type: 'critical',
    },
    {
      service: 'Women Emergency Helpline',
      number: '1091',
      desc: '24/7 immediate assistance, legal advice and emergency intervention for women',
      type: 'info',
    },
  ];

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num.replace(/[^0-9]/g, ''));
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  if (isDismissed) {
    return (
      <div className="bg-rose-900 text-white text-[11px] py-1 px-4 border-b border-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-semibold text-rose-200">
              Medical Emergency? Call 108 / 112 immediately.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="text-white hover:text-rose-200 underline font-bold cursor-pointer"
            >
              Emergency Directory
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(false)}
              className="text-rose-300 hover:text-white text-[10px] cursor-pointer"
            >
              Show Banner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* TOP EMERGENCY BANNER */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white text-xs py-2 px-3 sm:px-6 border-b border-rose-700/60 shadow-sm relative z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Alert Message */}
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-6 h-6 rounded-lg bg-rose-700/80 flex items-center justify-center shrink-0 text-white shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            </div>
            <p className="leading-tight text-[11px] sm:text-xs">
              <strong className="font-black text-rose-200 tracking-wide uppercase mr-1.5">
                Medical Emergency?
              </strong>
              <span>
                Call <strong className="text-white underline font-extrabold">108</strong> (Ambulance) or{' '}
                <strong className="text-white underline font-extrabold">112</strong>. QuickCare is for non-critical scheduled telemedicine.
              </span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 text-rose-900 font-extrabold text-[11px] rounded-lg shadow-xs transition hover:scale-102 cursor-pointer"
            >
              <PhoneCall className="w-3 h-3 text-rose-700" />
              <span>24/7 Helplines Directory</span>
            </button>

            <a
              href="tel:108"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition"
              title="Call National Ambulance Now"
            >
              <Phone className="w-3 h-3" />
              <span>Call 108</span>
            </a>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-rose-200 hover:text-white hover:bg-rose-800/80 rounded-md transition cursor-pointer ml-1"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 24/7 EMERGENCY HELPLINES MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Emergency Medical Helplines
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official 24/7 Toll-Free Emergency Support Services
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* When to call emergency vs QuickCare */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-1">
                <span className="font-extrabold text-rose-800 dark:text-rose-300 block text-[11px] uppercase tracking-wider">
                  ⚠️ Call 108 / Go to Hospital ER
                </span>
                <ul className="text-[11px] text-rose-900 dark:text-rose-300 space-y-0.5 list-disc list-inside">
                  <li>Severe chest pain or heart symptoms</li>
                  <li>Sudden numbness, stroke, or slurred speech</li>
                  <li>Severe respiratory distress or asthma</li>
                  <li>Uncontrolled bleeding or major trauma</li>
                </ul>
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-2xl space-y-1">
                <span className="font-extrabold text-teal-800 dark:text-teal-300 block text-[11px] uppercase tracking-wider">
                  🩺 Use QuickCare Telemedicine
                </span>
                <ul className="text-[11px] text-teal-900 dark:text-teal-300 space-y-0.5 list-disc list-inside">
                  <li>General physician & specialist consultations</li>
                  <li>Routine prescription renewals & digital Rx</li>
                  <li>Reviewing lab reports, scans & test results</li>
                  <li>Non-emergency fever, rash, joint pain, cough</li>
                </ul>
              </div>
            </div>

            {/* Helpline Directory List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {emergencyContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    contact.type === 'critical'
                      ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {contact.service}
                      </span>
                      {contact.type === 'critical' && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {contact.desc}
                    </p>
                    {contact.alt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Alternate: {contact.alt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(contact.number)}
                      className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                      title="Copy number"
                    >
                      {copiedNumber === contact.number ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <a
                      href={`tel:${contact.number.replace(/[^0-9]/g, '')}`}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                        contact.type === 'critical'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{contact.number}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                All helplines are toll-free and operate 24 hours a day, 365 days a year.
              </span>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
