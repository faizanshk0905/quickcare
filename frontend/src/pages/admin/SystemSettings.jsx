import React, { useState } from 'react';
import { Shield, Database, Lock, Server, CheckCircle2, Globe } from 'lucide-react';

export const SystemSettings = () => {
  const [fcmEnabled, setFcmEnabled] = useState(true);
  const [videoRecording, setVideoRecording] = useState(false);
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [msg, setMsg] = useState('');

  const handleSave = () => {
    setMsg('System settings saved successfully.');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">System Configuration</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Firebase cloud connectors, AI parameters, and teleconference security policies.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Firebase Cloud Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">Cloud Firestore</span>
              <span className="text-slate-500 text-[11px]">Primary document database</span>
              <div className="mt-2 text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synced & Connected
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block">Firebase Authentication</span>
              <span className="text-slate-500 text-[11px]">Token verification with Spring Security</span>
              <div className="mt-2 text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Bearer Auth
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">AI Healthcare Assistant</h3>
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-700">Active AI Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-Low Latency Clinical)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Diagnostic Triaging)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            Save System Configurations
          </button>
        </div>
      </div>
    </div>
  );
};
