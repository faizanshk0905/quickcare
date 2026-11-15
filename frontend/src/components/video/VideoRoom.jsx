import React, { useState, useEffect } from 'react';
import {
  Video,
  Shield,
  Clock,
  User,
  Stethoscope,
  FilePlus,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Calendar,
  Send,
} from 'lucide-react';
import { consultationService } from '../../services/consultationService';
import { appointmentService } from '../../services/appointmentService';

export const VideoRoom = ({ appointment, currentUser, onEndCall, onOpenPrescription }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [consultation, setConsultation] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customMeetUrl, setCustomMeetUrl] = useState(
    appointment?.googleMeetLink || appointment?.videoConsultationLink || ''
  );
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);
  const [meetSaveSuccess, setMeetSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isDoctor = currentUser?.role === 'DOCTOR';
  const otherParticipantName = isDoctor
    ? appointment?.patientName || 'Patient'
    : `Dr. ${appointment?.doctorName?.replace(/^(?:dr\.?\s*)+/i, '') || 'Doctor'}`;

  const meetUrl =
    appointment?.googleMeetLink ||
    appointment?.videoConsultationLink ||
    customMeetUrl ||
    'https://meet.google.com/new';

  const isLinkSent = Boolean(
    appointment?.videoLinkSent && (appointment?.googleMeetLink || appointment?.videoConsultationLink)
  );

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
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveMeetUrl = async (e) => {
    e.preventDefault();
    const trimmed = (customMeetUrl || '').trim();
    if (!trimmed || !trimmed.toLowerCase().includes('meet.google.com')) {
      setSaveError('Please enter a valid Google Meet link (e.g. https://meet.google.com/xxx-yyyy-zzz)');
      return;
    }
    try {
      setSavingMeetUrl(true);
      setSaveError('');
      await appointmentService.sendVideoConsultationLink(appointment.appointmentId, trimmed);
      setMeetSaveSuccess(true);
      setTimeout(() => setMeetSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update Google Meet link');
    } finally {
      setSavingMeetUrl(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Session Bar */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Google Meet Telehealth Session</span>
          </div>

          <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            {formatTime(callDuration)}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full">
            {isDoctor ? (
              <User className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span className="text-white font-medium">{otherParticipantName}</span>
          </span>
        </div>

        {/* Doctor Actions */}
        <div className="flex items-center gap-2">
          {isDoctor && onOpenPrescription && (
            <button
              onClick={onOpenPrescription}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Write Digital Prescription</span>
            </button>
          )}

          <button
            onClick={onEndCall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer active:scale-95"
            title="Complete / Leave Consultation"
          >
            <span>Exit Portal</span>
          </button>
        </div>
      </div>

      {/* Main Google Meet Consultation Card */}
      <div className="p-8 sm:p-12 text-center text-white space-y-6 max-w-3xl mx-auto w-full">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <Video className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
            Powered by Google Meet
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isDoctor ? `Consultation with ${appointment.patientName}` : `Consultation with Dr. ${appointment.doctorName?.replace(/^(?:dr\.?\s*)+/i, '')}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Scheduled for {appointment.appointmentDate} at {appointment.appointmentTime}. Click below to join the authorized Google Meet consultation room.
          </p>
        </div>

        {/* Prominent Join / Launch Button */}
        {isLinkSent || isDoctor ? (
          <div className="pt-2 space-y-4">
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              <Video className="w-5 h-5" />
              <span>{isDoctor ? 'Launch Google Meet Room' : 'Join Google Meet'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Meet Link Display & Copy */}
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs font-mono text-slate-300 truncate">{meetUrl}</span>
              <button
                type="button"
                onClick={() => handleCopyLink(meetUrl)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* When link is pending for patient */
          <div className="p-5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-left space-y-2 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Waiting for Doctor's Google Meet Link</span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Dr. {appointment.doctorName?.replace(/^(?:dr\.?\s*)+/i, '')} will send your official Google Meet invitation link prior to the appointment. The link will appear here and will be delivered to your registered email ({appointment.patientEmail}).
            </p>
          </div>
        )}

        {/* Doctor Management Section: Update Google Meet Link */}
        {isDoctor && (
          <form onSubmit={handleSaveMeetUrl} className="pt-6 border-t border-slate-800 text-left space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Update / Change Google Meet Link:</span>
              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Create New Google Meet</span>
              </a>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customMeetUrl}
                onChange={(e) => {
                  setCustomMeetUrl(e.target.value);
                  setSaveError('');
                }}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={savingMeetUrl}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingMeetUrl ? 'Updating...' : 'Update & Email Patient'}</span>
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {saveError}
              </p>
            )}
            {meetSaveSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Google Meet link updated and dispatched to patient email successfully!
              </p>
            )}
          </form>
        )}

        {/* Pre-Call Clinical Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800 text-left text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">1. Audio & Camera</span>
            <p className="text-[11px] text-slate-400">Ensure microphone and webcam are enabled in your browser.</p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">2. Quiet Setting</span>
            <p className="text-[11px] text-slate-400">Sit in a well-lit, private room for clear audio and clinical privacy.</p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200">3. Prior Records</span>
            <p className="text-[11px] text-slate-400">Keep prior lab reports, prescriptions, and symptoms ready.</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Medical Telehealth via Official Google Meet • QuickCare Network</span>
        </div>
      </div>
    </div>
  );
};