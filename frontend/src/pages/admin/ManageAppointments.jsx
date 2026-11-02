import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Calendar, Clock, Video, Building, Search, CheckCircle, XCircle } from 'lucide-react';

export const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllAppointments();
      if (res && res.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = appointments.filter((a) => {
    const matchesFilter = filter === 'ALL' || a.status === filter;
    const matchesSearch =
      !search.trim() ||
      a.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Manage All Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit clinical sessions, track completion rates, and observe platform scheduling activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor, patient, reason..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((tab) => {
          const count =
            tab === 'ALL'
              ? appointments.length
              : appointments.filter((a) => a.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-2xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === tab ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Attending Doctor</th>
                <th className="py-3.5 px-4">Consultation Mode</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No appointments match filter.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.appointmentId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {apt.appointmentDate}
                      <p className="text-[11px] font-normal text-slate-500">{apt.appointmentTime}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{apt.patientName}</span>
                      <p className="text-[10px] text-slate-400">{apt.patientPhone || apt.patientEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-teal-700">Dr. {apt.doctorName}</span>
                      <p className="text-[10px] text-slate-400">{apt.doctorSpecialization}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {apt.consultationType === 'VIDEO' ? (
                        <span className="inline-flex items-center gap-1 text-teal-600 font-semibold">
                          <Video className="w-3.5 h-3.5" /> Video Telehealth
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                          <Building className="w-3.5 h-3.5" /> Clinic Visit
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">₹{apt.consultationFee}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : apt.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
