import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Building,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  AlertCircle,
  Stethoscope,
  User,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';

export const AppointmentCard = ({
  appointment,
  role,
  onStatusChange,
  onReschedule,
  onViewPrescription,
  onRefresh,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [copiedMeetLink, setCopiedMeetLink] = useState(false);

  // Approval modal state (Doctor)
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalDate, setApprovalDate] = useState(appointment.appointmentDate || '');
  const [approvalTime, setApprovalTime] = useState(appointment.appointmentTime || '');
  const [doctorNotes, setDoctorNotes] = useState(
    appointment.doctorNotes || 'Please be in a quiet room with prior test reports, prescriptions, and device camera ready.'
  );
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Rejection modal state (Doctor)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Doctor is unavailable at requested time.');
  const [submittingReject, setSubmittingReject] = useState(false);

  const isDoctor = role === 'DOCTOR';
  const isPatient = role === 'PATIENT';

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedMeetLink(true);
    setTimeout(() => setCopiedMeetLink(false), 2000);
  };

  const handleConfirmResponse = async (response) => {
    try {
      setConfirming(true);
      const res = await appointmentService.confirmAvailability(appointment.appointmentId, response);
      setConfirmMsg(res?.message || 'Response recorded successfully.');
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDoctorApprove = async () => {
    try {
      setSubmittingApproval(true);
      await appointmentService.approveAppointment(appointment.appointmentId, {
        consultationDate: approvalDate,
        consultationTime: approvalTime,
        doctorNotes,
      });
      setShowApprovalModal(false);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleDoctorReject = async () => {
    try {
      setSubmittingReject(true);
      await appointmentService.rejectAppointment(appointment.appointmentId, {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rejection failed.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const getStatusBadge = (status, confirmationStatus) => {
    if (confirmationStatus === 'DECLINED' || status === 'DECLINED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Declined (Slot Released)
        </span>
      );
    }
    if (confirmationStatus === 'NOT_RESPONDED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Not Responded
        </span>
      );
    }
    if (confirmationStatus === 'SLOT_RELEASED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> Slot Released
        </span>
      );
    }
    if (confirmationStatus === 'CONFIRMED' || status === 'CONFIRMED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Confirmed
        </span>
      );
    }

    switch (status?.toUpperCase()) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      default:
        return null;
    }
  };

  const hasMeetLink = Boolean(appointment.googleMeetLink);
  const meetUrl = appointment.googleMeetLink || `https://meet.google.com/qck-care-${appointment.appointmentId?.slice(-3) || 'med'}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{appointment.appointmentDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{appointment.appointmentTime}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {appointment.consultationType === 'VIDEO' ? (
              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                <Video className="w-3.5 h-3.5" /> Video Telehealth
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Building className="w-3.5 h-3.5" /> In-Person Visit
              </span>
            )}
          </div>
        </div>
        <div>{getStatusBadge(appointment.status, appointment.confirmationStatus)}</div>
      </div>

      {/* CONFIRMATION FEEDBACK MESSAGE */}
      {confirmMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{confirmMsg}</span>
        </div>
      )}

      {/* 15-MINUTE APPOINTMENT CONFIRMATION BANNER (PATIENT) */}
      {isPatient && appointment.confirmationStatus === 'PENDING_CONFIRMATION' && !confirmMsg && (
        <div className="p-4 bg-gradient-to-r from-blue-50 via-teal-50 to-indigo-50 dark:from-slate-800 dark:via-teal-950/40 dark:to-slate-800 border-2 border-blue-400/80 dark:border-teal-700 rounded-2xl space-y-3 shadow-md animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 animate-ping shrink-0" />
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] uppercase rounded-full">
                Action Required • 15 Min Confirmation
              </span>
              <p className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                Your doctor appointment is scheduled in 15 minutes. Please confirm whether you are available for your consultation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={confirming}
              onClick={() => handleConfirmResponse('YES')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>YES, I AM AVAILABLE</span>
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={() => handleConfirmResponse('NO')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>NO, I AM NOT AVAILABLE</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
            {isDoctor ? 'Patient Name' : 'Consulting Doctor'}
          </span>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            {isDoctor ? <User className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
            {isDoctor ? appointment.patientName : appointment.doctorName?.startsWith('Dr.') ? appointment.doctorName : `Dr. ${appointment.doctorName}`}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isDoctor ? `Contact: ${appointment.patientPhone || appointment.patientEmail}` : appointment.doctorSpecialization}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
            Fee
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">₹{appointment.consultationFee}</span>
        </div>
      </div>

      {/* Reason */}
      {appointment.reason && (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Reason for Visit:</span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{appointment.reason}</p>
        </div>
      )}

      {/* GOOGLE MEET INTEGRATION CARD (When Video Consultation) */}
      {appointment.consultationType === 'VIDEO' &&
        appointment.status !== 'CANCELLED' &&
        appointment.status !== 'REJECTED' &&
        appointment.status !== 'DECLINED' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/80 via-blue-50/80 to-indigo-50/80 dark:from-slate-800/90 dark:via-teal-950/40 dark:to-slate-800/90 border border-teal-200 dark:border-teal-800/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">Google Meet Video Consultation</span>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                    Live Session Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Shared securely between Dr. {appointment.doctorName?.replace(/^Dr\.\s*/i, '')} & {appointment.patientName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyLink(meetUrl)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1"
                title="Copy Google Meet Link"
              >
                {copiedMeetLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Google Meet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-teal-100 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="truncate mr-2 font-bold text-teal-700 dark:text-teal-400">{meetUrl}</span>
            <span className="text-[10px] text-slate-400 font-sans shrink-0">Encrypted HD Room</span>
          </div>

          {appointment.doctorNotes && (
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Doctor's Consultation Instructions:</span>
              <p className="italic text-slate-600 dark:text-slate-400">{appointment.doctorNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
        {/* Doctor Actions */}
        {isDoctor && appointment.status === 'PENDING' && (
          <>
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              Decline Request
            </button>
            <button
              onClick={() => setShowApprovalModal(true)}
              className="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve & Generate Google Meet</span>
            </button>
          </>
        )}

        {/* Video Consultation & Virtual Waiting Room Button (Internal WebRTC Consultation Room option) */}
        {appointment.status === 'CONFIRMED' && appointment.consultationType === 'VIDEO' && (
          <Link
            to={`/consultations/${appointment.appointmentId}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {isDoctor
                ? 'Internal Clinical Room'
                : appointment.admitted
                ? 'Join Clinical Room'
                : 'Virtual Waiting Room'}
            </span>
          </Link>
        )}

        {/* Doctor Mark Completed */}
        {isDoctor && appointment.status === 'CONFIRMED' && (
          <button
            onClick={() => onStatusChange && onStatusChange(appointment.appointmentId, 'COMPLETED')}
            className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition"
          >
            Mark as Completed
          </button>
        )}

        {/* Patient Cancel & Reschedule */}
        {isPatient && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
          <>
            <button
              onClick={() => onStatusChange && onStatusChange(appointment.appointmentId, 'CANCELLED')}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              Cancel
            </button>
            {onReschedule && (
              <button
                onClick={() => onReschedule(appointment)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reschedule
              </button>
            )}
          </>
        )}

        {/* View Prescription if completed */}
        {appointment.status === 'COMPLETED' && (
          <button
            onClick={() => onViewPrescription && onViewPrescription(appointment)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Prescription</span>
          </button>
        )}
      </div>

      {/* DOCTOR APPROVE MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Approve Consultation & Generate Google Meet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review schedule, provide pre-consultation notes, and dispatch meeting invitation.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Patient</label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                  {appointment.patientName} ({appointment.patientEmail || appointment.patientPhone})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Consultation Date</label>
                  <input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Consultation Time</label>
                  <input
                    type="text"
                    value={approvalTime}
                    onChange={(e) => setApprovalTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Doctor Notes & Instructions for Patient
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Please keep your previous test reports handy and be in a quiet space."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  What happens upon approval:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-teal-700 dark:text-teal-300">
                  <li>A genuine Google Meet link is generated automatically.</li>
                  <li>In-app notification is sent to {appointment.patientName}.</li>
                  <li>A confirmation email with the Google Meet link is delivered to {appointment.patientEmail || 'the patient'}.</li>
                  <li>Meeting appears in both Doctor and Patient portals.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={submittingApproval}
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingApproval}
                onClick={handleDoctorApprove}
                className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submittingApproval ? 'Generating Meet...' : 'Confirm Approval & Generate Meet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Decline Consultation Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notify {appointment.patientName} regarding the cancellation reason.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">Reason for Declining</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify reason for decline..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
              <p className="text-[11px] text-slate-400">
                The patient will receive an email and in-app notification with this reason and can choose to reschedule.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={submittingReject}
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submittingReject}
                onClick={handleDoctorReject}
                className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{submittingReject ? 'Declining...' : 'Confirm Decline'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};