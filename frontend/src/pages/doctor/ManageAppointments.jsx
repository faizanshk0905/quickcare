import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { AppointmentCard } from '../../components/common/AppointmentCard';
import { Calendar, Search, Filter } from 'lucide-react';

export const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getDoctorAppointments();
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

  const handleStatusChange = async (appointmentId, status) => {
    try {
      await appointmentService.updateStatus(appointmentId, status);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed.');
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesTab = activeTab === 'ALL' || a.status === activeTab;
    const matchesSearch =
      !search.trim() ||
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Manage Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review incoming consultation requests, conduct Google Meet telehealth sessions, and manage patient visits.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name..."
            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-teal-500 w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => {
          const count =
            tab === 'ALL'
              ? appointments.length
              : appointments.filter((a) => a.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab ? 'bg-teal-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No appointments found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Appointments matching your filter will be shown here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((apt) => (
            <AppointmentCard
              key={apt.appointmentId}
              appointment={apt}
              role="DOCTOR"
              onStatusChange={handleStatusChange}
              onRefresh={fetchAppointments}
            />
          ))}
        </div>
      )}
    </div>
  );
};
