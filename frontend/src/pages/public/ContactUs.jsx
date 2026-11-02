import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, PhoneCall } from 'lucide-react';

export const ContactUs = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          We're Here to Support Your Healthcare
        </h1>
        <p className="text-sm text-slate-600">
          Have queries about appointment scheduling, doctor onboarding, or telehealth technical support? Reach out anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact info cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl space-y-2">
            <span className="font-extrabold text-xs text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
              <PhoneCall className="w-4 h-4 text-rose-600" /> Medical Emergency Helpline
            </span>
            <p className="text-3xl font-black text-rose-950">108 / 112</p>
            <p className="text-xs text-rose-800">
              Free 24/7 Government Emergency Ambulance & Disaster Response.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/80 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Support Email</span>
                <span className="text-xs font-bold text-slate-800">support@quickcare.health</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Care</span>
                <span className="text-xs font-bold text-slate-800">+91 1800 266 4321</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Headquarters</span>
                <span className="text-xs font-bold text-slate-800">QuickCare Health Tech Park, Pune, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Send us a Message</h3>
          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-900">Message Received</h4>
              <p className="text-xs text-emerald-700">
                Our patient relations team will respond to your registered email within 2 business hours.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject of your inquiry"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="How can we help you?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
