import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, PhoneCall, Mail, MapPin, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                QUICK<span className="text-blue-500">CARE</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Transforming outpatient healthcare with verified doctor appointments, HIPAA-ready WebRTC video consultations, intelligent symptom triaging, and tamper-resistant digital prescriptions.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/50">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Certified Healthcare Security & Encryption</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-blue-400 transition">Home</Link></li>
              <li><Link to="/doctors" className="hover:text-blue-400 transition">Search Doctors</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition">About QuickCare</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition">Contact Us</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Sign In Portal</Link></li>
            </ul>
          </div>

          {/* Specializations */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Top Specialities</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/doctors?specialization=Cardiology" className="hover:text-blue-400 transition">Cardiology</Link></li>
              <li><Link to="/doctors?specialization=Dermatology" className="hover:text-blue-400 transition">Dermatology</Link></li>
              <li><Link to="/doctors?specialization=Pediatrics" className="hover:text-blue-400 transition">Pediatrics</Link></li>
              <li><Link to="/doctors?specialization=Orthopedics" className="hover:text-blue-400 transition">Orthopedics</Link></li>
              <li><Link to="/doctors?specialization=Neurology" className="hover:text-blue-400 transition">Neurology</Link></li>
            </ul>
          </div>

          {/* Emergency & Helpline */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">Emergency & Support</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                <p className="font-bold flex items-center gap-1.5 text-rose-400">
                  <PhoneCall className="w-3.5 h-3.5" /> Emergency Ambulance
                </p>
                <p className="text-xl font-extrabold text-white mt-1">108 / 112</p>
                <p className="text-[10px] text-rose-300/80">Available 24/7 across India</p>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>support@quickcare.health</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>QuickCare HQ, Medical Tech Park</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} QUICK CARE Healthcare Technologies. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            *Notice: QuickCare is an appointment and telemedicine platform. If experiencing a life-threatening event, call 108 immediately.
          </p>
        </div>
      </div>
    </footer>
  );
};
