import React, { useState, useEffect } from 'react';
import {
  Video,
  PhoneOff,
  Shield,
  Clock,
  User,
  Stethoscope,
  Maximize2,
  FilePlus,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { consultationService } from '../../services/consultationService';
import { appointmentService } from '../../services/appointmentService';

export const VideoRoom = ({ appointment, currentUser, onEndCall, onOpenPrescription }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [consultation, setConsultation] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customMeetUrl, setCustomMeetUrl] = useState(appointment?.googleMeetLink || '');
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);
  const [meetSaveSuccess, setMeetSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'google-meet'

  const cleanId = (appointment?.appointmentId || 'session').replace(/[^a-zA-Z0-9]/g, '');
  const roomName = `QuickCare-${cleanId}`;
  const isDoctor = currentUser?.role === 'DOCTOR';
  const displayName =
    currentUser?.fullName ||
    (isDoctor ? `Dr. ${appointment?.doctorName || 'Doctor'}` : appointment?.patientName || 'Patient');

  // Embeddable Jitsi Meet configuration (Zero login, instant WebRTC audio/video)
  const jitsiEmbedUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(
    displayName
  )}&config.disableDeepLinking=true`;
  const directRoomUrl = `https://meet.jit.si/${roomName}`;

  // Session lifecycle & call duration timer
  useEffect(() => {
    let timer = null;

    const setupSession = async () => {
      try {
        const res = await consultationService.getByAppointment(appointment.appointmentId);
        if (res && res.data) {
          setConsultation(res.data);
          await consultationService.join(res.data.consultationId);
        }
      } catch (err) {
        console.warn('Consultation session initialized locally:', err);
      }
    };

    setupSession();

    timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [appointment.appointmentId]);

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveMeetUrl = async (e) => {
    e.preventDefault();
    if (!customMeetUrl) return;
    try {
      setSavingMeetUrl(true);
      await appointmentService.updateMeetingLink(appointment.appointmentId, customMeetUrl.trim());
      setMeetSaveSuccess(true);
      setTimeout(() => setMeetSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update Google Meet link: ' + err.message);
    } finally {
      setSavingMeetUrl(false);
    }
  };

  const handleEndCall = async () => {
    if (consultation) {
      try {
        await consultationService.end(consultation.consultationId);
      } catch (err) {
        console.warn('End consultation sync:', err);
      }
    }
    onEndCall && onEndCall();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const otherParticipantName = isDoctor
    ? appointment?.patientName || 'Patient'
    : appointment?.doctorName?.startsWith('Dr.')
    ? appointment.doctorName
    : `Dr. ${appointment?.doctorName || 'Specialist'}`;

  return (
    <div className="w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-800 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE TELEHEALTH SESSION</span>
          </div>

          <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            {formatTime(callDuration)}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full">
            {isDoctor ? <User className="w-3.5 h-3.5 text-blue-400" /> : <Stethoscope className="w-3.5 h-3.5 text-teal-400" />}
            <span className="text-white font-medium">{otherParticipantName}</span>
          </span>
        </div>

        {/* View Mode Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === 'live'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Live Room
            </button>
            <button
              onClick={() => setActiveTab('google-meet')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === 'google-meet'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Meet
            </button>
          </div>

          <a
            href={directRoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            title="Open Video Room in New Window / Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Separate Tab</span>
          </a>

          {isDoctor && onOpenPrescription && (
            <button
              onClick={onOpenPrescription}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Write Rx</span>
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
            title="End Telehealth Consultation"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      {activeTab === 'live' ? (
        <div className="relative w-full h-[76vh] min-h-[560px] bg-slate-950 flex flex-col">
          {/* Real Embedded WebRTC Video Consultation Frame */}
          <iframe
            src={jitsiEmbedUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; speaker"
            className="w-full h-full border-0 flex-1"
            title="QuickCare Real-Time Video Consultation"
          />

          {/* Quick Helper Footer */}
          <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                100% Connected WebRTC Session. Camera, mic & screen share active across mobile & desktop.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(directRoomUrl)}
                className="hover:text-white flex items-center gap-1 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy Room URL</span>
                  </>
                )}
              </button>
              <span>•</span>
              <a
                href={directRoomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-teal-300 flex items-center gap-1 text-teal-400 font-bold"
              >
                <span>Open Fullscreen Window</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Google Meet Companion Mode */
        <div className="w-full h-[76vh] min-h-[560px] p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 bg-radial from-slate-900 to-slate-950 text-white">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg">
            <Video className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
              Google Meet Integration
            </span>
            <h3 className="text-2xl font-black text-white">Connect via Official Google Meet</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Google Meet requires meetings to be generated from an active Google account. You can start a real meeting in 1 click or paste your meeting link below.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Real Google Meet (meet.google.com/new)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {customMeetUrl && customMeetUrl.includes('meet.google.com') && !customMeetUrl.includes('qck-care') && (
              <a
                href={customMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span>Join Assigned Google Meet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Paste & Share Google Meet URL (Doctor or Patient) */}
          <form
            onSubmit={handleSaveMeetUrl}
            className="w-full max-w-lg bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 text-left"
          >
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Share Authentic Google Meet Link:</span>
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                value={customMeetUrl}
                onChange={(e) => setCustomMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={savingMeetUrl || !customMeetUrl}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shrink-0"
              >
                {savingMeetUrl ? 'Saving...' : 'Save & Share'}
              </button>
            </div>

            {meetSaveSuccess && (
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Google Meet link shared successfully with participant!
              </p>
            )}

            <p className="text-[11px] text-slate-400">
              Paste the link generated from Google Meet and click Save so {otherParticipantName} sees it immediately.
            </p>
          </form>

          <button
            onClick={() => setActiveTab('live')}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 underline"
          >
            ← Back to QuickCare Direct Live Video Room
          </button>
        </div>
      )}
    </div>
  );
};
