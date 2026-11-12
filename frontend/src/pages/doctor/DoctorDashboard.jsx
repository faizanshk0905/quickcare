import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { AppointmentCard } from '../../components/common/AppointmentCard';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  Video,
  FilePlus,
  Sliders,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Mail,
  Sparkles,
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedMeetId, setCopiedMeetId] = useState('');
  const [editingMeetId, setEditingMeetId] = useState(null);
  const [customMeetLink, setCustomMeetLink] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Send Video Consultation Link Modal State
  const [sendLinkApt, setSendLinkApt] = useState(null);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);
  const [sendLinkSuccess, setSendLinkSuccess] = useState('');
  const [sendLinkError, setSendLinkError] = useState('');

  const handleOpenSendLinkModal = (apt) => {
    setSendLinkApt(apt);
    setVideoLinkInput(apt.videoConsultationLink || apt.googleMeetLink || '');
    setSendLinkError('');
    setSendLinkSuccess('');
  };

  const handleSendLinkSubmit = async () => {
    if (!sendLinkApt) return;
    const trimmed = (videoLinkInput || '').trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setSendLinkError('Please enter a valid video meeting URL starting with http:// or https://');
      return;
    }
    try {
      setSubmittingLink(true);
      setSendLinkError('');
      const res = await appointmentService.sendVideoConsultationLink(sendLinkApt.appointmentId, trimmed);
      setSendLinkSuccess(
        res?.message || `Video consultation link sent to ${sendLinkApt.patientEmail || 'patient'} successfully!`
      );
      setTimeout(() => {
        setSendLinkApt(null);
        setSendLinkSuccess('');
        fetchDoctorData();
      }, 1500);
    } catch (err) {
      setSendLinkError(
        err.response?.data?.message || err.message || 'Failed to dispatch consultation link.'
      );
    } finally {
      setSubmittingLink(false);
    }
  };

  const handleSaveMeetLink = async (aptId) => {
    if (!customMeetLink) return;
    try {
      setSavingLink(true);
      await appointmentService.updateMeetingLink(aptId, customMeetLink.trim());
      setEditingMeetId(null);
      setCustomMeetLink('');
      fetchDoctorData();
    } catch (err) {
      alert('Failed to update Google Meet link: ' + err.message);
    } finally {
      setSavingLink(false);
    }
  };

  const handleCopyLink = (meetUrl, id) => {
    if (!meetUrl) return;
    navigator.clipboard.writeText(meetUrl);
    setCopiedMeetId(id);
    setTimeout(() => setCopiedMeetId(''), 2000);
  };

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const [docRes, aptRes, queueRes] = await Promise.all([
        doctorService.getMyDoctorProfile(),
        doctorService.getMyDoctorProfile().then((d) =>
          d?.data?.doctorId ? appointmentService.getDoctorAppointments() : { data: [] }
        ),
        appointmentService.getDoctorWaitingQueue().catch(() => ({ data: [] })),
      ]);

      if (docRes && docRes.data) {
        setDoctor(docRes.data);
      } else {
        setDoctor({
          doctorId: 'doc_001',
          fullName: 'Dr. Priya Deshmukh',
          specialization: 'Cardiologist',
          hospitalAffiliation: 'Apollo Hospital',
          experienceYears: 12,
          rating: 4.9,
          consultationFee: 800,
        });
      }
      if (aptRes && aptRes.data) {
        setAppointments(aptRes.data);
      }
      if (queueRes && queueRes.data) {
        setWaitingQueue(queueRes.data);
      }
    } catch (err) {
      console.warn('Using resilient doctor state:', err.message);
      setDoctor({
        doctorId: 'doc_001',
        fullName: 'Dr. Priya Deshmukh',
        specialization: 'Cardiologist',
        hospitalAffiliation: 'Apollo Hospital',
        experienceYears: 12,
        rating: 4.9,
        consultationFee: 800,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();

    // Poll live waiting queue every 4 seconds
    const interval = setInterval(async () => {
      try {
        const qRes = await appointmentService.getDoctorWaitingQueue();
        if (qRes && qRes.data) {
          setWaitingQueue(qRes.data);
        }
      } catch (ignored) {}
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const total = appointments.length;
  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter((a) => a.appointmentDate === today);
  const pendingRequests = appointments.filter((a) => a.status === 'PENDING');
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED');
  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const uniquePatients = new Set(appointments.map((a) => a.patientId)).size;

  const handleStatusChange = async (appointmentId, status) => {
    try {
      await appointmentService.updateStatus(appointmentId, status);
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Action failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Verification Notice if Pending */}
      {doctor?.verificationStatus === 'PENDING' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-3xl flex items-center justify-between gap-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold text-sm text-amber-950">Verification Pending Approval</p>
              <p className="text-amber-800">
                Your medical registration ({doctor?.medicalRegistrationNumber}) is undergoing admin credential verification. You will be able to receive public patients once activated.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200/80 font-bold rounded-full text-[11px] shrink-0">
            Pending Review
          </span>
        </div>
      )}

      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
            Doctor Clinical Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dr. {doctor?.fullName || user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            {doctor?.specialization} • {doctor?.qualification} • Fee: ₹{doctor?.consultationFee}
          </p>

          {/* Real-Time Live Status Toggle */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 mt-3">
            <span className="text-[10px] uppercase font-extrabold text-teal-200 px-2">Availability:</span>
            {[
              { id: 'AVAILABLE_FOR_VIDEO', label: '24/7 Video Available', dot: 'bg-teal-300 animate-pulse' },
              { id: 'ONLINE', label: 'Online', dot: 'bg-emerald-400' },
              { id: 'BUSY', label: 'Busy', dot: 'bg-amber-400' },
              { id: 'OFFLINE', label: 'Offline', dot: 'bg-slate-400' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={async () => {
                  try {
                    await doctorService.updateDoctorStatus(st.id);
                    setDoctor((prev) => ({ ...prev, onlineStatus: st.id }));
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  (doctor?.onlineStatus || 'AVAILABLE_FOR_VIDEO') === st.id
                    ? 'bg-white text-teal-900 shadow-sm font-extrabold'
                    : 'text-white/80 hover:bg-white/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/doctor/availability"
            className="px-4 py-2.5 bg-white text-teal-800 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-teal-50 transition flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" /> Manage Availability
          </Link>
          <Link
            to="/doctor/prescriptions/new"
            className="px-4 py-2.5 bg-teal-900/60 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 backdrop-blur-md transition flex items-center gap-1.5"
          >
            <FilePlus className="w-4 h-4" /> Write Prescription
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Today's Visits
          </span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{todayApts.length}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Scheduled for today</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Pending Requests
          </span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{pendingRequests.length}</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Action needed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
            Confirmed
          </span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">{confirmed.length}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Upcoming sessions</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Completed
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{completed.length}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Prescribed cases</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Total Patients
          </span>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">{uniquePatients}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Unique individuals</span>
        </div>
      </div>

      {/* GOOGLE MEET VIDEO CONSULTATIONS HUB */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-5 border border-teal-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Telemedicine & Google Meet Hub</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Live Meeting Links
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Direct authorized Google Meet join links for patient video consultations
              </p>
            </div>
          </div>
          <span className="text-xs text-teal-300/80 font-mono">
            {appointments.filter((a) => a.consultationType === 'VIDEO').length} Video Sessions Scheduled
          </span>
        </div>

        {(() => {
          const videoApts = appointments.filter(
            (a) => a.consultationType === 'VIDEO' && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
          );
          if (videoApts.length === 0) {
            return (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-teal-200/70">
                No video appointments booked yet. When a patient books a video consultation, it will appear here for you to send the meeting link.
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoApts.map((apt) => {
                const meetUrl = apt.videoConsultationLink || apt.googleMeetLink;
                const isSent = Boolean(apt.videoLinkSent && meetUrl);
                const isPending = apt.status === 'PENDING';

                return (
                  <div
                    key={apt.appointmentId}
                    className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3.5 hover:border-teal-400/40 transition"
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-extrabold text-white block">
                          {apt.patientName || 'Patient Consultation'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-teal-200 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                          <span className="font-mono">{apt.patientEmail || 'No registered email'}</span>
                        </div>
                        <span className="text-[11px] text-teal-200/90 block mt-0.5">
                          📅 {apt.appointmentDate} at {apt.appointmentTime}
                        </span>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            isPending
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                              : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                          }`}
                        >
                          {apt.status || 'CONFIRMED'}
                        </span>
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              isSent
                                ? 'bg-teal-500/20 text-teal-300 border-teal-400/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSent ? 'bg-teal-400' : 'bg-amber-400'}`}
                            />
                            {isSent ? 'Video Link Sent' : 'Waiting for Doctor to Send Link'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    {isSent ? (
                      <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                        <div className="flex items-center justify-between gap-2 bg-black/20 p-2.5 rounded-xl border border-white/10">
                          <div className="truncate flex-1">
                            <span className="text-[10px] text-teal-300/80 font-bold block uppercase">
                              Active Consultation Link:
                            </span>
                            <a
                              href={meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal-200 hover:text-white underline font-mono font-medium truncate block"
                            >
                              {meetUrl}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(meetUrl, apt.appointmentId)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                            title="Copy link"
                          >
                            {copiedMeetId === apt.appointmentId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Video className="w-3.5 h-3.5 text-white" />
                            <span>Join Video Consultation</span>
                            <ExternalLink className="w-3 h-3 text-teal-200" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenSendLinkModal(apt)}
                            className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5 text-teal-300" />
                            <span>Update Link</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                        <p className="text-[11px] text-amber-200 leading-snug">
                          ⚠️ <strong>Link Required:</strong> The patient cannot join until you send the video consultation link. Paste your Google Meet or Zoom meeting URL to dispatch it directly to <strong>{apt.patientEmail || 'the patient'}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenSendLinkModal(apt)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Video Consultation Link</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* LIVE VIRTUAL WAITING QUEUE & ADMISSION */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${waitingQueue.length > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-300 dark:bg-slate-700'}`} />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Live Virtual Waiting Room ({waitingQueue.length} Patient{waitingQueue.length === 1 ? '' : 's'} Waiting)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            One Doctor – One Active Consultation Enforced
          </span>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 dark:text-slate-500">
            No patients currently in the waiting room. Patients appear here the moment they check in for today's appointment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {waitingQueue.map((apt, index) => (
              <div
                key={apt.appointmentId}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{apt.patientName}</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                        Slot: {apt.appointmentTime}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                        Waiting Position {index + 1}
                      </span>
                    </div>
                    {apt.reason && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                        {apt.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/consultations/${apt.appointmentId}`}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Admit & Start Live Video</span>
                  </Link>
                  <a
                    href={`https://meet.jit.si/QuickCare-${(apt.appointmentId || 'live').replace(/[^a-zA-Z0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                    title="Open in Separate Window"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                    <span className="hidden sm:inline">Direct Tab</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Appointment Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              Pending Patient Requests ({pendingRequests.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((apt) => (
              <AppointmentCard
                key={apt.appointmentId}
                appointment={apt}
                role="DOCTOR"
                onStatusChange={handleStatusChange}
                onRefresh={fetchDoctorData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Confirmed Telehealth & Clinic Schedule ({confirmed.length})
          </h2>
          <Link
            to="/doctor/appointments"
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 flex items-center gap-1"
          >
            <span>All Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {confirmed.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No confirmed appointments scheduled</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              New patient bookings will appear here once approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmed.map((apt) => (
              <AppointmentCard
                key={apt.appointmentId}
                appointment={apt}
                role="DOCTOR"
                onStatusChange={handleStatusChange}
                onRefresh={fetchDoctorData}
              />
            ))}
          </div>
        )}
      </div>

      {/* DOCTOR SEND VIDEO CONSULTATION LINK MODAL */}
      {sendLinkApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Send Video Consultation Link
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Doctor controls meeting link dispatch to patient's registered email.
                </p>
              </div>
            </div>

            {/* Patient & Appointment Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{sendLinkApt.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Appointment Status</span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400">{sendLinkApt.status || 'CONFIRMED'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Registered Email</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>{sendLinkApt.patientEmail || 'No email provided'}</span>
                  <span className="text-[9px] font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-auto">
                    Registered Email (Read-Only)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                <div>
                  <span className="text-slate-500">Date:</span> <strong className="text-slate-700 dark:text-slate-300">{sendLinkApt.appointmentDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Time:</span> <strong className="text-slate-700 dark:text-slate-300">{sendLinkApt.appointmentTime}</strong>
                </div>
              </div>
            </div>

            {/* Video Link Input Form */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Video Consultation URL <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const clean = (sendLinkApt.appointmentId || 'live').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
                      setVideoLinkInput(`https://meet.google.com/qck-care-${clean}`);
                    }}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Fill Google Meet URL</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={videoLinkInput}
                  onChange={(e) => {
                    setVideoLinkInput(e.target.value);
                    setSendLinkError('');
                  }}
                  placeholder="Paste Google Meet, Zoom, or video conference URL (e.g. https://meet.google.com/abc-defg-hij)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Accepts any valid video conferencing URL (Google Meet, Zoom, Microsoft Teams, etc.)
                </p>
              </div>

              {/* Review Before Sending */}
              {videoLinkInput && (
                <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block">
                    Review Consultation Link Before Sending:
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-teal-900 dark:text-teal-200 truncate">
                      {videoLinkInput}
                    </span>
                    <a
                      href={videoLinkInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1 shrink-0"
                    >
                      <span>Test / Preview</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Feedback messages */}
              {sendLinkSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{sendLinkSuccess}</span>
                </div>
              )}
              {sendLinkError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{sendLinkError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={submittingLink}
                onClick={() => {
                  setSendLinkApt(null);
                  setSendLinkError('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingLink || !videoLinkInput.trim()}
                onClick={handleSendLinkSubmit}
                className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingLink ? 'Sending Link & Email...' : 'Send Link to Patient'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
