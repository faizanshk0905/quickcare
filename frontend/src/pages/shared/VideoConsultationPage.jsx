import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { VideoRoom } from '../../components/video/VideoRoom';
import {
  ArrowLeft,
  Stethoscope,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
  CheckCircle,
  Radio,
  Lock,
} from 'lucide-react';

export const VideoConsultationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [waitingStatus, setWaitingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admitting, setAdmitting] = useState(false);
  const [error, setError] = useState('');

  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  // Fetch appointment details and check-in patient
  useEffect(() => {
    let isMounted = true;

    const initConsultation = async () => {
      try {
        setLoading(true);
        const res = await appointmentService.getAppointmentById(appointmentId);
        if (isMounted && res && res.data) {
          setAppointment(res.data);

          // If current user is patient and appointment is confirmed, trigger check-in
          if (user?.role === 'PATIENT' && !res.data.patientCheckedIn && res.data.status === 'CONFIRMED') {
            try {
              await appointmentService.checkIn(appointmentId);
            } catch (checkInErr) {
              console.warn('Check-in handled:', checkInErr.message);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load consultation session.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initConsultation();

    return () => {
      isMounted = false;
    };
  }, [appointmentId, user?.role]);

  // Real-time polling for Waiting Room & Admission Status (every 2.5s)
  useEffect(() => {
    let isMounted = true;

    const pollStatus = async () => {
      if (!appointmentId) return;
      try {
        const res = await appointmentService.getWaitingStatus(appointmentId);
        if (isMounted && res && res.data) {
          setWaitingStatus(res.data);
          // If admitted, update appointment meetingRoomId if available
          if (res.data.admitted && res.data.meetingRoomId) {
            setAppointment((prev) =>
              prev ? { ...prev, admitted: true, meetingRoomId: res.data.meetingRoomId } : prev
            );
          }
        }
      } catch (err) {
        // Silent poll error handling
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [appointmentId]);

  // Doctor Action: Admit patient from waiting room
  const handleAdmitPatient = async () => {
    try {
      setAdmitting(true);
      setError('');
      const res = await appointmentService.admit(appointmentId);
      if (res && res.data) {
        setAppointment(res.data);
        setWaitingStatus((prev) => ({ ...prev, admitted: true }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not admit patient. You may have another active consultation.'
      );
    } finally {
      setAdmitting(false);
    }
  };

  const handleEndCall = () => {
    if (isDoctor) {
      navigate(`/doctor/prescriptions/new?appointmentId=${appointment.appointmentId}`);
    } else {
      navigate('/patient/appointments');
    }
  };

  const handleOpenPrescription = () => {
    navigate(`/doctor/prescriptions/new?appointmentId=${appointment.appointmentId}`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Connecting to encrypted medical consultation channel...
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-xl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-base text-slate-900">Session Access Restricted</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Check if patient is in Virtual Waiting Room (not yet admitted)
  const isPatientInWaitingRoom = isPatient && !waitingStatus?.admitted;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Leave Consultation Room
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Dr. {appointment.doctorName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
            <User className="w-3.5 h-3.5" />
            <span>Patient: {appointment.patientName}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. PATIENT VIRTUAL WAITING ROOM */}
      {isPatientInWaitingRoom ? (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-8 animate-in fade-in">
          {/* Animated Clinical Pulse Icon */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Radio className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider rounded-full">
              Virtual Clinical Waiting Room
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              You are Checked In & Waiting
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Please keep this window open. Dr. {appointment.doctorName} has been notified and will admit you into the private consultation room momentarily.
            </p>
          </div>

          {/* Doctor Current Status Card */}
          <div
            className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 ${
              waitingStatus?.doctorStatus === 'BUSY'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                waitingStatus?.doctorStatus === 'BUSY'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <div className="space-y-1">
              <p className="font-extrabold text-xs">
                {waitingStatus?.doctorStatus === 'BUSY'
                  ? 'Doctor is Currently in Consultation'
                  : 'Doctor is Available'}
              </p>
              <p className="text-xs leading-relaxed opacity-90">
                {waitingStatus?.doctorBusyReason ||
                  (waitingStatus?.doctorStatus === 'BUSY'
                    ? 'Doctor is currently consulting another patient. Please wait.'
                    : 'Doctor is available and will admit you shortly.')}
              </p>
            </div>
          </div>

          {/* Queue Position Card */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Queue Position
              </span>
              <p className="text-2xl font-black text-blue-600 mt-0.5">
                Waiting Position {waitingStatus?.queuePosition || 1}
              </p>
              <span className="text-[11px] text-slate-500">Live order in doctor's waiting queue</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Scheduled Slot
              </span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{appointment.appointmentTime}</p>
              <span className="text-[11px] text-slate-500">{appointment.appointmentDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted WebRTC Session automatically opens upon doctor admission</span>
          </div>
        </div>
      ) : isDoctor && !waitingStatus?.admitted ? (
        /* 2. DOCTOR ADMISSION GATEWAY */
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-extrabold rounded-full">
              Patient Admission Portal
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Consultation with {appointment.patientName}
            </h2>
            <p className="text-xs text-slate-500">
              Scheduled Slot: {appointment.appointmentDate} at {appointment.appointmentTime}
            </p>
          </div>

          {/* Patient Check-in State */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Patient Status:</span>
              {waitingStatus?.patientCheckedIn ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> In Virtual Waiting Room
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">
                  Not Checked In Yet
                </span>
              )}
            </div>

            {appointment.reason && (
              <p className="text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                <strong>Chief Complaint:</strong> {appointment.reason}
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 text-left flex items-start gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>One Doctor – One Active Consultation:</strong> Admitting this patient locks your consultation session to this meeting room. Other patients will wait in the queue until you conclude this call.
            </span>
          </div>

          <button
            onClick={handleAdmitPatient}
            disabled={admitting || !waitingStatus?.patientCheckedIn}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/25 transition active:scale-95 flex items-center justify-center gap-2"
          >
            {admitting ? (
              <span>Admitting Patient...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Admit Patient & Start Consultation</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* 3. ACTIVE SECURE ENCRYPTED VIDEO ROOM */
        <VideoRoom
          appointment={appointment}
          currentUser={user}
          onEndCall={handleEndCall}
          onOpenPrescription={handleOpenPrescription}
        />
      )}
    </div>
  );
};
