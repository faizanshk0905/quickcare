import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  Video,
  Bot,
  FileText,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  Users,
  CheckCircle,
  Lock,
  Sparkles,
  Layers,
  Activity,
  BellRing,
  Stethoscope,
} from 'lucide-react';

export const Home = () => {
  const { t } = useTranslation();

  const specialities = [
    { name: 'Cardiology', icon: '❤️', doctors: 'Heart & Vascular', desc: 'Preventive cardiology, ECG, blood pressure & coronary management' },
    { name: 'Dermatology', icon: '✨', doctors: 'Skin & Allergy', desc: 'Clinical dermatology, eczema, psoriasis & allergy treatment' },
    { name: 'Pediatrics', icon: '👶', doctors: 'Child Healthcare', desc: 'Neonatal care, child growth monitoring & routine immunizations' },
    { name: 'Orthopedics', icon: '🦴', doctors: 'Bone & Joints', desc: 'Joint replacement, spine care, arthritis & sports rehabilitation' },
    { name: 'Neurology', icon: '🧠', doctors: 'Neuro Care', desc: 'Comprehensive diagnosis for neurological & migraine disorders' },
    { name: 'Dentistry', icon: '🦷', doctors: 'Oral Health', desc: 'Preventive dental care, oral surgery & clinical hygiene' },
  ];

  const platformFeatures = [
    {
      icon: Clock,
      color: 'blue',
      title: 'Automated 15-Minute Slot Engine',
      description: 'Continuous 15-minute appointment slots generated automatically based on doctor schedules, break timings, and timezones with zero double-booking.',
    },
    {
      icon: Lock,
      color: 'indigo',
      title: 'One Doctor – One Active Consultation',
      description: 'Strict concurrency-safe active consultation locking protects patient privacy by ensuring doctors can never conduct overlapping video meetings.',
    },
    {
      icon: Users,
      color: 'purple',
      title: 'Virtual Waiting Room & Queue Position',
      description: 'Patients monitor their live position in queue while doctors admit patients sequentially upon finishing their ongoing consultation.',
    },
    {
      icon: BellRing,
      color: 'emerald',
      title: '15-Min Auto-Confirmation & Reallocation',
      description: 'Patients receive an availability prompt 15 minutes before consultations; declined or unconfirmed slots are released instantly to other patients.',
    },
    {
      icon: Bot,
      color: 'teal',
      title: 'AI Clinical Triaging & Strict Matching',
      description: 'Multilingual symptom triaging in English, Hindi, and Marathi that routes only to verified specialties and honestly informs when a specialty is unlisted.',
    },
    {
      icon: FileText,
      color: 'sky',
      title: 'Encrypted Video & Digital Rx',
      description: 'High-definition browser-native WebRTC telemedicine consultations coupled with official digital prescriptions and 1-click PDF downloads.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Next-Gen Smart Telemedicine & Clinic Appointments</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.15]">
                {t('hero.title')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {t('hero.subtitle')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/doctors"
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 hover:translate-y-[-2px]"
                >
                  <Calendar className="w-5 h-5" />
                  <span>{t('hero.ctaBook')}</span>
                </Link>

                <Link
                  to="/register"
                  className="px-5 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all flex items-center gap-2 hover:translate-y-[-2px]"
                >
                  <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Join as Patient</span>
                </Link>

                <Link
                  to="/register-doctor"
                  className="px-5 py-3.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold rounded-2xl border border-teal-200/80 dark:border-teal-800 shadow-xs transition-all flex items-center gap-2 hover:translate-y-[-2px]"
                >
                  <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Join as a Doctor</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800 max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">100%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified Doctors</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">24/7</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">AI Clinical Triaging</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">4.9/5</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Patient Rating</p>
                </div>
              </div>
            </div>

            {/* Right Column: Platform Architecture & Technology Console (No Individual Doctor Info) */}
            <div className="lg:col-span-5 relative">
              {/* Soft Ambient Glows */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Main Platform Showcase Card */}
              <div className="relative mx-auto max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                {/* Header: Platform Status Bar */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">QuickCare Cloud Engine</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Real-Time Healthcare Architecture</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-100 dark:border-emerald-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System Active</span>
                  </div>
                </div>

                {/* Core Architecture Metric Tiles */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/30 border border-blue-100/70 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold bg-white/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-md">Automated</span>
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">15-Min</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">Continuous Slot Engine</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Atomic double-booking prevention</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-slate-800 dark:to-teal-950/30 border border-teal-100/70 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-bold bg-white/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-md">Isolated</span>
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">1-on-1</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">Consultation Lock</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Protected patient privacy</p>
                  </div>
                </div>

                {/* Platform Clinical Capabilities Feed */}
                <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Platform Services</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Live Synchronized</span>
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Virtual Waiting Room</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Real-time queue tracking & doctor admission</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">Live</span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200">AI Clinical Triaging</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Strict verified specialty symptom matching</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">24/7</span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Digital e-Prescriptions</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Instant authorized PDF clinical summary</p>
                      </div>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">Instant</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/register"
                    className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition text-center flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Join as Patient</span>
                  </Link>
                  <Link
                    to="/register-doctor"
                    className="py-3 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-bold text-xs rounded-xl shadow-2xs transition text-center flex items-center justify-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Join as Doctor</span>
                  </Link>
                </div>
              </div>

              {/* Floating Trust Pills */}
              <div className="hidden sm:flex absolute -bottom-5 -left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg items-center gap-2 text-xs text-slate-800 dark:text-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-[11px] leading-tight">15-Min Automated Alerts</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Instant slot reallocation on decline</p>
                </div>
              </div>

              <div className="hidden sm:flex absolute -top-4 -right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg items-center gap-2 text-xs text-slate-800 dark:text-slate-200">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-[11px] leading-tight">Encrypted Telemedicine</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Google Meet & Clinical Standards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
            Clinical Disciplines
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            Explore Medical Specialities
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Find the right clinical discipline tailored to your exact symptoms and condition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialities.map((s, idx) => (
            <Link
              key={idx}
              to={`/doctors?specialization=${s.name}`}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 hover:translate-y-[-2px] transition group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full">
                  {s.doctors}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {s.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Browse Speciality</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS / 4-STEP WORKFLOW */}
      <section className="bg-slate-900 dark:bg-slate-900/90 border border-transparent dark:border-slate-800 text-white py-20 rounded-3xl max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-teal-400 tracking-wider uppercase">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            How QuickCare Simplifies Healthcare
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            From discovering the right clinical department to receiving authorized digital prescriptions in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-base text-white">Find or Ask AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use smart clinical filters or tell QuickCare AI your symptoms in English, Hindi, or Marathi for instant triaging.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-teal-500 text-white font-extrabold text-sm flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-base text-white">Select Live 15-Min Slot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose your preferred date and open 15-minute time slot with concurrency-safe booking guarantees.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-base text-white">Video Consultation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Join the private Google Meet or encrypted telehealth room with camera, microphone, and direct clinical communication.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center">
              4
            </span>
            <h3 className="font-bold text-base text-white">Digital Prescription</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive authorized digital prescriptions with diagnosis, medicine dosages, and 1-click PDF download immediately.
            </p>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM CAPABILITIES & TECHNOLOGY SUITE (No Individual Doctor Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
            Platform Technology
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            Why Patients & Healthcare Facilities Trust QuickCare
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            An integrated telemedicine ecosystem built with Google Meet integration, concurrency-safe scheduling, and clinical safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg transition space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Experience Modern Healthcare with QuickCare
            </h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Book consultations in seconds, monitor virtual queue position in real time, and receive instant digital prescriptions from any device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/register-doctor"
              className="px-7 py-3.5 bg-white text-blue-700 font-extrabold text-xs rounded-2xl shadow-lg hover:bg-blue-50 transition shrink-0 flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>Join as a Doctor</span>
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-xs rounded-2xl border border-white/20 transition shrink-0"
            >
              Join as Patient
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
