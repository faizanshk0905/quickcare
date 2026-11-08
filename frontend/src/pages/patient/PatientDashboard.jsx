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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes] = await Promise.all([
        appointmentService.getPatientAppointments(),
        doctorService.searchDoctors(),
      ]);

      if (aptRes && aptRes.data) {
        setAppointments(aptRes.data);
      }
      if (docRes && docRes.data) {
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
  }, []);

  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const pending = appointments.filter((a) => a.status === 'PENDING').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Patient Health Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || 'Patient'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            You have <strong className="text-white">{confirmed} confirmed</strong> upcoming consultations. Need symptom advice? Our AI Healthcare Assistant is active 24/7.
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{total}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">All recorded visits</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Confirmed
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{confirmed}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ready to join</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">{pending}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Awaiting doctor</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-2">{completed}</p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">With prescriptions</span>
        </div>
      </div>

      {/* Upcoming Consultations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Upcoming Consultations ({upcomingAppointments.length})
          </h2>
          <Link
            to="/patient/appointments"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1"
          >
            <span>All Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading appointments...</div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No upcoming consultations</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Find top specialists in Cardiology, Dermatology, Pediatrics, and more to book your visit.
            </p>
            <Link
              to="/doctors"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Browse Doctors
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
