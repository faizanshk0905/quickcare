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
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const [docRes, aptRes] = await Promise.all([
        doctorService.getMyDoctorProfile(),
        doctorService.getMyDoctorProfile().then((d) =>
          d?.data?.doctorId ? appointmentService.getDoctorAppointments() : { data: [] }
        ),
      ]);

      if (docRes && docRes.data) {
        setDoctor(docRes.data);
      }
      if (aptRes && aptRes.data) {
        setAppointments(aptRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
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
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Today's Visits
          </span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{todayApts.length}</p>
          <span className="text-[10px] text-slate-400">Scheduled for today</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Pending Requests
          </span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingRequests.length}</p>
          <span className="text-[10px] text-amber-600">Action needed</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">
            Confirmed
          </span>
          <p className="text-2xl font-extrabold text-teal-600 mt-1">{confirmed.length}</p>
          <span className="text-[10px] text-slate-400">Upcoming sessions</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Completed
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{completed.length}</p>
          <span className="text-[10px] text-slate-400">Prescribed cases</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
            Total Patients
          </span>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">{uniquePatients}</p>
          <span className="text-[10px] text-slate-400">Unique individuals</span>
        </div>
      </div>

      {/* Pending Appointment Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Confirmed Telehealth & Clinic Schedule ({confirmed.length})
          </h2>
          <Link
            to="/doctor/appointments"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>All Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {confirmed.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No confirmed appointments scheduled</p>
            <p className="text-xs text-slate-400 mt-1">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
