import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Users,
  Stethoscope,
  ShieldCheck,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowRight,
  Shield,
  Eye,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, docRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllDoctors(),
      ]);

      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }
      if (docRes && docRes.data) {
        setPendingDoctors(docRes.data.filter((d) => d.verificationStatus === 'PENDING'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleVerify = async (doctorId, approve) => {
    setVerifyingId(doctorId);
    try {
      await adminService.verifyDoctor(doctorId, approve, approve ? 'Approved' : 'Qualifications could not be verified.');
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Verification update failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const completionRate = stats?.totalAppointments
    ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md flex items-center gap-1.5 w-fit mx-auto md:mx-0">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            Administrative Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Healthcare System Analytics
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
            Real-time monitoring of registered patients, doctor credential approvals, telemedicine sessions, and clinical metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/admin/doctors"
            className="px-4 py-2.5 bg-white text-purple-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-purple-50 transition"
          >
            Review Doctors
          </Link>
          <Link
            to="/admin/appointments"
            className="px-4 py-2.5 bg-purple-700/60 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition"
          >
            All Appointments
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {stats?.totalPatients ?? 0}
          </p>
          <span className="text-[10px] text-slate-400">Registered citizens</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
              Total Doctors
            </span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-700 mt-2">
            {stats?.totalDoctors ?? 0}
          </p>
          <span className="text-[10px] text-teal-600 font-bold">
            {stats?.verifiedDoctors ?? 0} Verified • {stats?.pendingDoctorApprovals ?? 0} Pending
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Appointments
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-2">
            {stats?.totalAppointments ?? 0}
          </p>
          <span className="text-[10px] text-indigo-600">
            {stats?.confirmedAppointments ?? 0} confirmed
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {completionRate}%
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {stats?.completedAppointments ?? 0} successfully treated
          </span>
        </div>
      </div>

      {/* Pending Doctor Approvals Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            Pending Doctor Verifications ({pendingDoctors.length})
          </h2>
          <Link
            to="/admin/doctors"
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-slate-200/80 text-xs text-slate-400">
            All registered doctors have been reviewed. No pending verifications.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDoctors.map((doc) => (
              <div
                key={doc.doctorId}
                className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        doc.profileImage ||
                        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120'
                      }
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.fullName}</h4>
                      <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                    PENDING
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medical Reg No:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {doc.medicalRegistrationNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience:</span>
                    <span className="font-bold text-slate-800">{doc.experience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Proposed Fee:</span>
                    <span className="font-bold text-slate-800">₹{doc.consultationFee}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleVerify(doc.doctorId, false)}
                    disabled={verifyingId === doc.doctorId}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(doc.doctorId, true)}
                    disabled={verifyingId === doc.doctorId}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                  >
                    {verifyingId === doc.doctorId ? 'Verifying...' : 'Approve Credentials'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialization Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Specialization Distribution
            </h3>
          </div>

          <div className="space-y-3">
            {stats?.specializationStats &&
              Object.entries(stats.specializationStats).map(([spec, count]) => {
                const pct = Math.round((count / (stats.totalDoctors || 1)) * 100);
                return (
                  <div key={spec} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">{spec}</span>
                      <span className="text-slate-500 font-semibold">
                        {count} Doctors ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Appointment Status Breakdown
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Confirmed Telehealth / Clinic Visits',
                count: stats?.confirmedAppointments || 0,
                color: 'bg-teal-500',
              },
              {
                label: 'Completed & Prescribed Consultations',
                count: stats?.completedAppointments || 0,
                color: 'bg-emerald-500',
              },
              {
                label: 'Pending Initial Requests',
                count: stats?.pendingAppointments || 0,
                color: 'bg-amber-500',
              },
              {
                label: 'Cancelled / Declined Visits',
                count: stats?.cancelledAppointments || 0,
                color: 'bg-rose-500',
              },
            ].map((item, idx) => {
              const total = stats?.totalAppointments || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="text-slate-500 font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
