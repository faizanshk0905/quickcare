import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Video,
  FileText,
  Calendar,
  ShieldCheck,
  FolderOpen,
  PhoneCall,
  Sparkles,
  ArrowRight,
  X,
  MessageSquare,
} from 'lucide-react';

export const FaqSection = ({
  compact = false,
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about QuickCare consultations, prescriptions, and security.',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expandedIndex, setExpandedIndex] = useState(0); // First FAQ opened by default

  const categories = [
    { id: 'ALL', label: 'All FAQs', icon: Sparkles },
    { id: 'VIDEO', label: 'Video Consultations', icon: Video },
    { id: 'PRESCRIPTION', label: 'Prescriptions & QR', icon: FileText },
    { id: 'REPORTS', label: 'Medical Reports Upload', icon: FolderOpen },
    { id: 'APPOINTMENTS', label: 'Appointments & Rescheduling', icon: Calendar },
    { id: 'DOCTORS', label: 'Doctor Verification & Safety', icon: ShieldCheck },
    { id: 'EMERGENCY', label: 'Emergency Guidance', icon: PhoneCall },
  ];

  const faqs = [
    {
      category: 'VIDEO',
      question: 'How do video consultations work on QuickCare?',
      answer:
        'Once your appointment is confirmed, the attending physician reviews your symptoms and dispatches an encrypted Google Meet video consultation link directly to your registered email and your Patient Dashboard. You can also join through our virtual waiting room, which displays your live position in queue.',
      tags: ['google meet', 'video call', 'telehealth', 'waiting room', 'link'],
    },
    {
      category: 'PRESCRIPTION',
      question: 'How do I download and verify my digital prescription?',
      answer:
        'After your consultation is completed, your doctor issues an official digital prescription. You can view and download it as an authenticated PDF with 1-click from your dashboard. Every prescription includes a scannable QR code and cryptographic verification hash that links directly to our online registry (/verify-prescription) to prove authenticity at any pharmacy.',
      tags: ['prescription', 'pdf', 'qr code', 'verification', 'pharmacy', 'rx'],
    },
    {
      category: 'REPORTS',
      question: 'Can I upload my prior medical test reports, X-rays, or blood work?',
      answer:
        'Yes! Navigate to the "Medical Reports" tab in your Patient Dashboard. You can upload diagnostic lab reports, imaging scans, pathology records, and discharge summaries in PDF, PNG, or JPG formats. Attending doctors can review your uploaded files directly from their clinical portal before and during your consultation.',
      tags: ['medical reports', 'upload', 'lab tests', 'x-ray', 'scans', 'blood test', 'pathology'],
    },
    {
      category: 'APPOINTMENTS',
      question: 'How does the automated 15-minute slot engine prevent double-booking?',
      answer:
        'Our intelligent scheduling engine operates with strict concurrency safety. It dynamically calculates 15-minute consultation slots based on each doctor\'s customized working hours, break times, and days. A slot is reserved exclusively in real-time, completely preventing overlapping or double-booked consultations.',
      tags: ['15-minute slot', 'booking', 'schedule', 'doctor timing', 'double-booking'],
    },
    {
      category: 'APPOINTMENTS',
      question: 'Can I cancel or reschedule an existing appointment?',
      answer:
        'Yes. In your Patient Appointments tab, select any pending or confirmed appointment and click "Reschedule" to choose a new convenient date and time, or click "Cancel" if you are unable to attend. The freed slot is immediately returned to the doctor\'s availability calendar for other patients.',
      tags: ['cancel', 'reschedule', 'change time', 'refund', 'booking'],
    },
    {
      category: 'DOCTORS',
      question: 'How are doctors verified before they can consult on QuickCare?',
      answer:
        'QuickCare enforces strict clinical onboarding standards. Every medical practitioner must submit their Medical Council of India (MCI) registration certificate, MBBS/MD qualifications, clinic details, and photo identification. Our clinical compliance administration team validates all credentials before granting access to consult.',
      tags: ['doctor verification', 'mci', 'credentials', 'qualification', 'license', 'admin'],
    },
    {
      category: 'EMERGENCY',
      question: 'What should I do if I am experiencing a critical medical emergency?',
      answer:
        'QuickCare is designed strictly for non-critical, outpatient telemedicine. If you or someone around you experiences life-threatening symptoms—such as severe chest pain, stroke symptoms (facial drooping, slurred speech), severe breathing distress, or major trauma—please call 108 (Ambulance) or 112 immediately or proceed to the nearest hospital emergency room.',
      tags: ['emergency', '108', 'ambulance', '112', 'hospital', 'critical', 'chest pain'],
    },
    {
      category: 'DOCTORS',
      question: 'Is my health data and personal consultation private and secure?',
      answer:
        'Yes. All patient records, uploaded diagnostic documents, and medical consultations are safeguarded using industry-standard TLS/AES-256 encryption. We enforce strict role-based access control ensuring only you and your authorized consulting physicians can access your health data.',
      tags: ['security', 'privacy', 'encryption', 'hipaa', 'confidentiality'],
    },
  ];

  // Filtered FAQs based on category & search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === 'ALL' || faq.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchQuestion = faq.question.toLowerCase().includes(q);
      const matchAnswer = faq.answer.toLowerCase().includes(q);
      const matchTags = faq.tags.some((t) => t.toLowerCase().includes(q));

      return matchQuestion || matchAnswer || matchTags;
    });
  }, [faqs, activeCategory, searchQuery]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* SECTION HEADER */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>QuickCare Knowledge & Help Center</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* SEARCH BAR & CATEGORY FILTERS */}
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. video call, QR verification, reports upload, 108 helpline)..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCORDION FAQ LIST */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No matching questions found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any results matching "{searchQuery}". Try using different keywords or consult our 24/7 AI Healthcare Assistant.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl border transition-all ${
                  isExpanded
                    ? 'border-blue-300 shadow-md ring-1 ring-blue-100'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        isExpanded
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      Q{index + 1}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isExpanded
                        ? 'bg-blue-50 text-blue-600 rotate-180'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                    <p className="mt-2">{faq.answer}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                        Related:
                      </span>
                      {faq.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* STILL HAVE QUESTIONS FOOTNOTE */}
      {!compact && (
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 via-teal-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-sm">
              Didn't find the answer you were looking for?
            </h4>
            <p className="text-xs text-slate-600">
              Our 24/7 AI Healthcare Assistant and dedicated patient support team are ready to help.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/contact"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};
