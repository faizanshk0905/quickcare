import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { AppointmentCard } from '../../components/common/AppointmentCard';
import { DoctorCard } from '../../components/common/DoctorCard';
import { PrescriptionModal } from '../../components/common/PrescriptionModal';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Bot,
  ArrowRight,
  Sparkles,
  Video,
} from 'lucide-react';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes] = await Promise.all([
        appointmentService.getPatientAppointments().catch(() => ({ data: [] })),
        doctorService.searchDoctors().catch(() => ({ data: [] })),
      ]);

      if (aptRes && Array.isArray(aptRes.data)) {
        setAppointments(aptRes.data);
      }
      if (docRes && Array.isArray(docRes.data) && docRes.data.length > 0) {
        setRecommendedDoctors(docRes.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching patient dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleAppointmentsUpdated = () => fetchDashboardData();
    window.addEventListener('quickcare_appointments_updated', handleAppointmentsUpdated);
    return () => window.removeEventListener('quickcare_appointments_updated', handleAppointmentsUpdated);
  }, []);

  const total = appointments.length;
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );
  const upcoming = upcomingAppointments.length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelled = appointments.filter(
    (a) => a.status === 'CANCELLED' || a.status === 'REJECTED' || a.status === 'DECLINED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top IST Live Clock & Date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Kolkata',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1 bg-slate-900 text-white rounded-full font-mono text-[11px] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">IST:</span>
          <span className="font-bold text-emerald-300 tracking-wider">{istTime || 'Loading...'}</span>
        </div>
      </div>

      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Patient Health Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {total === 0 ? `Welcome, ${user?.fullName || 'Patient'}!` : `Welcome back, ${user?.fullName || 'Patient'}!`}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {total === 0
              ? 'You have 0 appointments. Book your first appointment with a verified doctor to get started.'
              : `You have ${upcoming} upcoming consultation${upcoming === 1 ? '' : 's'}. Need clinical triage? Our AI Healthcare Assistant is active 24/7.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/doctors"
            className="px-5 py-3 bg-white text-blue-700 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:bg-blue-50 transition active:scale-95 flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Book Appointment
          </Link>
          <Link
            to="/patient/prescriptions"
            className="px-5 py-3 bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Digital Prescriptions
          </Link>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Appointments
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{total}</p>
          <span className="text-[11px] text-slate-400 font-medium">All patient bookings</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Upcoming Appointments
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">{upcoming}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Confirmed & pending</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Completed Appointments
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">{completed}</p>
          <span className="text-[11px] text-blue-600 font-medium">Prescribed & fulfilled</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Cancelled Appointments
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-2">{cancelled}</p>
          <span className="text-[11px] text-rose-600 font-medium">Released & cancelled</span>
        </div>
      </div>

      {/* Upcoming Consultations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Upcoming Consultations ({upcomingAppointments.length})
          </h2>
          <Link
            to="/patient/appointments"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>All Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading appointments...</div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No appointments yet!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Book your first appointment with a doctor to get started.
            </p>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              <Search className="w-4 h-4" />
              <span>Book an Appointment</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.appointmentId}
                appointment={apt}
                role="PATIENT"
                onRefresh={fetchDashboardData}
                onStatusChange={async (id, status) => {
                  await appointmentService.updateStatus(id, status);
                  fetchDashboardData();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommended Doctors Row */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Recommended Specialists</h2>
          <Link
            to="/doctors"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedDoctors.map((doc) => (
            <DoctorCard key={doc.doctorId} doctor={doc} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
};
