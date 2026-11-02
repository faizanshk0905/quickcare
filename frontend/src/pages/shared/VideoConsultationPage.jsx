import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { VideoRoom } from '../../components/video/VideoRoom';
import { ArrowLeft, Stethoscope, User, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

export const VideoConsultationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const res = await appointmentService.getAppointmentById(appointmentId);
        if (res && res.data) {
          setAppointment(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load consultation session.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Connecting to encrypted consultation channel...
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-xl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-base text-slate-900">Session Access Restricted</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {error || 'Unable to join consultation session.'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleEndCall = () => {
    if (user?.role === 'DOCTOR') {
      navigate(`/doctor/prescriptions/new?appointmentId=${appointment.appointmentId}`);
    } else {
      navigate('/patient/appointments');
    }
  };

  const handleOpenPrescription = () => {
    navigate(`/doctor/prescriptions/new?appointmentId=${appointment.appointmentId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Status */}
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

      {/* Video Room */}
      <VideoRoom
        appointment={appointment}
        currentUser={user}
        onEndCall={handleEndCall}
        onOpenPrescription={handleOpenPrescription}
      />
    </div>
  );
};
