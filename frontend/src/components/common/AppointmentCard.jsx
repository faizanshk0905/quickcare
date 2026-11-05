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
  Radio,
  ShieldAlert,
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
  const isDoctor = role === 'DOCTOR';
  const isPatient = role === 'PATIENT';

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

  const getStatusBadge = (status, confirmationStatus) => {
    if (confirmationStatus === 'DECLINED' || status === 'DECLINED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Declined (Slot Released)
        </span>
      );
    }
    if (confirmationStatus === 'NOT_RESPONDED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Not Responded
        </span>
      );
    }
    if (confirmationStatus === 'SLOT_RELEASED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> Slot Released
        </span>
      );
    }
    if (confirmationStatus === 'CONFIRMED' || status === 'CONFIRMED') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Confirmed
        </span>
      );
    }

    switch (status?.toUpperCase()) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{appointment.appointmentDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>{appointment.appointmentTime}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            {appointment.consultationType === 'VIDEO' ? (
              <span className="flex items-center gap-1 text-teal-600">
                <Video className="w-3.5 h-3.5" /> Video Telehealth
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-600">
                <Building className="w-3.5 h-3.5" /> In-Person Visit
              </span>
            )}
          </div>
        </div>
        <div>{getStatusBadge(appointment.status, appointment.confirmationStatus)}</div>
      </div>

      {/* CONFIRMATION FEEDBACK MESSAGE */}
      {confirmMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{confirmMsg}</span>
        </div>
      )}

      {/* 15-MINUTE APPOINTMENT CONFIRMATION BANNER (PATIENT) */}
      {isPatient && appointment.confirmationStatus === 'PENDING_CONFIRMATION' && !confirmMsg && (
        <div className="p-4 bg-gradient-to-r from-blue-50 via-teal-50 to-indigo-50 border-2 border-blue-400/80 rounded-2xl space-y-3 shadow-md animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 animate-ping shrink-0" />
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] uppercase rounded-full">
                Action Required • 15 Min Confirmation
              </span>
              <p className="text-xs font-black text-slate-900 leading-snug">
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
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            {isDoctor ? 'Patient Name' : 'Consulting Doctor'}
          </span>
          <h4 className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
            {isDoctor ? <User className="w-4 h-4 text-blue-600" /> : <Stethoscope className="w-4 h-4 text-teal-600" />}
            {isDoctor ? appointment.patientName : `Dr. ${appointment.doctorName}`}
          </h4>
          <p className="text-xs text-slate-500">
            {isDoctor ? `Contact: ${appointment.patientPhone || appointment.patientEmail}` : appointment.doctorSpecialization}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Fee
          </span>
          <span className="text-base font-extrabold text-slate-900">₹{appointment.consultationFee}</span>
        </div>
      </div>

      {/* Reason */}
      {appointment.reason && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <span className="font-bold text-slate-700 block mb-0.5">Reason for Visit:</span>
          <p className="text-slate-600 leading-relaxed">{appointment.reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
        {/* Doctor Actions */}
        {isDoctor && appointment.status === 'PENDING' && (
          <>
            <button
              onClick={() => onStatusChange && onStatusChange(appointment.appointmentId, 'REJECTED')}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              Decline
            </button>
            <button
              onClick={() => onStatusChange && onStatusChange(appointment.appointmentId, 'CONFIRMED')}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              Accept Appointment
            </button>
          </>
        )}

        {/* Video Consultation & Virtual Waiting Room Button (For both when CONFIRMED) */}
        {appointment.status === 'CONFIRMED' && appointment.consultationType === 'VIDEO' && (
          <Link
            to={`/consultations/${appointment.appointmentId}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Video className="w-4 h-4 animate-pulse" />
            <span>
              {isDoctor
                ? 'Manage & Enter Video Consultation'
                : appointment.admitted
                ? 'Join Active Video Consultation'
                : 'Enter Virtual Waiting Room'}
            </span>
          </Link>
        )}

        {/* Doctor Mark Completed */}
        {isDoctor && appointment.status === 'CONFIRMED' && (
          <button
            onClick={() => onStatusChange && onStatusChange(appointment.appointmentId, 'COMPLETED')}
            className="px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition"
          >
            Mark as Completed
          </button>
        )}

        {/* Patient Cancel & Reschedule */}
        {isPatient && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
          <>
            <button
              onClick={() => onStatusChange && onStatusChange(appointment.appointmentId, 'CANCELLED')}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              Cancel
            </button>
            {onReschedule && (
              <button
                onClick={() => onReschedule(appointment)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-1"
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Prescription</span>
          </button>
        )}
      </div>
    </div>
  );
};
