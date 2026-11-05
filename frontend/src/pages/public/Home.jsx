import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doctorService } from '../../services/doctorService';
import { DoctorCard } from '../../components/common/DoctorCard';
import {
  HeartPulse,
  Video,
  Bot,
  FileText,
  ShieldCheck,
  Star,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Stethoscope,
  Activity,
  Award,
  Users,
  CheckCircle,
} from 'lucide-react';

export const Home = () => {
  const { t } = useTranslation();
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.searchDoctors();
        if (res && res.data) {
          setFeaturedDoctors(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load featured doctors', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const specialities = [
    { name: 'Cardiology', icon: '❤️', doctors: '24+ Doctors', desc: 'Heart care, ECG & BP management' },
    { name: 'Dermatology', icon: '✨', doctors: '18+ Doctors', desc: 'Skin, hair & allergy specialists' },
    { name: 'Pediatrics', icon: '👶', doctors: '32+ Doctors', desc: 'Infant health, child care & vaccines' },
    { name: 'Orthopedics', icon: '🦴', doctors: '15+ Doctors', desc: 'Joint replacement, bone & spine care' },
    { name: 'Neurology', icon: '🧠', doctors: '12+ Doctors', desc: 'Brain, nerves & headache treatment' },
    { name: 'Dentistry', icon: '🦷', doctors: '20+ Doctors', desc: 'Teeth alignment, oral hygiene & surgery' },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Next-Gen Smart Telemedicine & Clinic Appointments</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                {t('hero.title')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {t('hero.subtitle')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/doctors"
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 hover:translate-y-[-2px]"
                >
                  <Calendar className="w-5 h-5" />
                  <span>{t('hero.ctaBook')}</span>
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 hover:translate-y-[-2px]"
                >
                  <Users className="w-5 h-5 text-teal-600" />
                  <span>Join as Patient</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Verified Doctors</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-blue-600">24/7</p>
                  <p className="text-xs text-slate-500 font-medium">AI Clinical Triaging</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-teal-600">4.9/5</p>
                  <p className="text-xs text-slate-500 font-medium">Patient Rating</p>
                </div>
              </div>
            </div>

            {/* Right Column: Professional TeleHealth & 15-Minute Slot Live Showcase */}
            <div className="lg:col-span-5 relative">
              {/* Soft Ambient Glows */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Main Showcase Card */}
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
                {/* Live Clinic Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">QuickCare TeleHealth Hub</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1 border border-blue-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Verified Specialists
                  </span>
                </div>

                {/* Doctor Profile Showcase */}
                <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 rounded-2xl border border-blue-100/70">
                  <div className="relative shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
                      alt="Dr. Priya Deshmukh"
                      className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online & Available Now" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">Dr. Priya Deshmukh</h3>
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-xs text-blue-700 font-semibold truncate">Senior Cardiologist • MD, DM</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        4.9
                      </span>
                      <span>•</span>
                      <span>14 yrs exp</span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">₹800</span>
                    </div>
                  </div>
                </div>

                {/* Next Available 15-Minute Slot Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      15-Minute Live Slots Today
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      Instant Booking
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Link
                      to="/doctors/doc_001"
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
                    >
                      <p className="text-[9px] uppercase font-semibold text-blue-100">Fastest</p>
                      <p className="text-xs font-extrabold">10:00 AM</p>
                    </Link>
                    <Link
                      to="/doctors/doc_001"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      <p className="text-[9px] text-slate-400 font-medium">Available</p>
                      <p className="text-xs font-extrabold">10:15 AM</p>
                    </Link>
                    <Link
                      to="/doctors/doc_001"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      <p className="text-[9px] text-slate-400 font-medium">Available</p>
                      <p className="text-xs font-extrabold">10:30 AM</p>
                    </Link>
                  </div>
                </div>

                {/* Live Telehealth Capabilities */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700">
                    <Video className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold">WebRTC HD Video</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700">
                    <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold">Instant Digital Rx</span>
                  </div>
                </div>

                {/* Action CTA */}
                <Link
                  to="/doctors"
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
                >
                  <span>Explore Verified Specialists & Book</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Floating Trust Pills */}
              <div className="hidden sm:flex absolute -bottom-5 -left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-lg items-center gap-2 text-xs text-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-[11px] leading-tight">Virtual Waiting Room</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Queue Position & Admittance</p>
                </div>
              </div>

              <div className="hidden sm:flex absolute -top-4 -right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-lg items-center gap-2 text-xs text-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-[11px] leading-tight">AI Clinical Triaging</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Strict Specialist Matching</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase">
            Clinical Disciplines
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
            Explore Medical Specialities
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Find the right expert care tailored to your exact symptoms and condition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialities.map((s, idx) => (
            <Link
              key={idx}
              to={`/doctors?specialization=${s.name}`}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 hover:translate-y-[-2px] transition group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                  {s.doctors}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                {s.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>View Doctors</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS / 4-STEP WORKFLOW */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-teal-400 tracking-wider uppercase">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            How QuickCare Simplifies Healthcare
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            From discovering the right specialist to receiving authorized digital prescriptions in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-base text-white">Find or Ask AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use our smart doctor filters or tell QuickCare AI your symptoms in English, Hindi, or Marathi for an instant recommendation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-teal-500 text-white font-extrabold text-sm flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-base text-white">Select Live Slot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose your preferred date and verified doctor's open time slot with double-booking prevention.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-base text-white">Video Consultation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Join the private encrypted WebRTC telehealth room with camera, microphone, and direct doctor communication.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center">
              4
            </span>
            <h3 className="font-bold text-base text-white">Digital Prescription</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive doctor's digital prescription with diagnosis, medicine doses, and one-click PDF download immediately.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED TOP DOCTORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase">
              Top Medical Faculty
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Recommended Verified Doctors
            </h2>
          </div>
          <Link
            to="/doctors"
            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading doctors...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDoctors.map((doc) => (
              <DoctorCard key={doc.doctorId} doctor={doc} />
            ))}
          </div>
        )}
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Are you a licensed medical practitioner?
            </h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Join QuickCare network, manage your digital schedule, accept verified telemedicine consultations, and expand your clinical practice.
            </p>
          </div>
          <Link
            to="/register-doctor"
            className="px-8 py-4 bg-white text-blue-700 font-extrabold rounded-2xl shadow-lg hover:bg-blue-50 transition shrink-0"
          >
            Register as Doctor
          </Link>
        </div>
      </section>
    </div>
  );
};
