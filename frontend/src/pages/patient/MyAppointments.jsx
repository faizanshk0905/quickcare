import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { prescriptionService } from '../../services/prescriptionService';
import { AppointmentCard } from '../../components/common/AppointmentCard';
import { PrescriptionModal } from '../../components/common/PrescriptionModal';
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  X,
} from 'lucide-react';

export const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [openSlots, setOpenSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reschedulingLoading, setReschedulingLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Prescription Modal State
  const [viewingPrescription, setViewingPrescription] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getPatientAppointments();
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

  // When opening reschedule modal, fetch slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (!rescheduleTarget || !newDate) return;
      try {
        const res = await doctorService.getDoctorAvailability(rescheduleTarget.doctorId, newDate);
        if (res && res.data) {
          const booked = res.data.bookedSlots || [];
          const open = (res.data.availableSlots || []).filter((s) => !booked.includes(s));
          setOpenSlots(open);
          setSelectedSlot('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSlots();
  }, [rescheduleTarget, newDate]);

  const handleStatusChange = async (appointmentId, status) => {
    try {
      await appointmentService.updateStatus(appointmentId, status);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed.');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setRescheduleError('');
    if (!selectedSlot) {
      setRescheduleError('Please choose a time slot.');
      return;
    }
    setReschedulingLoading(true);
    try {
      await appointmentService.reschedule(rescheduleTarget.appointmentId, newDate, selectedSlot);
      setRescheduleTarget(null);
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg.toLowerCase().includes('booked') || msg.toLowerCase().includes('unavailable')) {
        setRescheduleError('This appointment slot has just been booked. Please select another slot.');
      } else {
        setRescheduleError(msg || 'Failed to reschedule appointment.');
      }
    } finally {
      setReschedulingLoading(false);
    }
  };

  const handleViewPrescription = async (appointment) => {
    try {
      const res = await prescriptionService.getPatientPrescriptions();
      if (res && res.data) {
        const matching = res.data.find((p) => p.appointmentId === appointment.appointmentId);
        if (matching) {
          setViewingPrescription(matching);
        } else {
          alert('Prescription details are being processed by the doctor.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    return apt.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">My Appointments</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review, reschedule, or cancel your consultations, and join your secure video calls.
        </p>
      </div>

      {/* Filter Tabs */}
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
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Appointments */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No {activeTab.toLowerCase()} appointments</h3>
          <p className="text-xs text-slate-400 mt-1">
            Appointments matching this filter will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((apt) => (
            <AppointmentCard
              key={apt.appointmentId}
              appointment={apt}
              role="PATIENT"
              onStatusChange={handleStatusChange}
              onReschedule={(target) => setRescheduleTarget(target)}
              onViewPrescription={handleViewPrescription}
              onRefresh={fetchAppointments}
            />
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Reschedule Consultation</h3>
              </div>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rescheduling appointment with <strong>Dr. {rescheduleTarget.doctorName}</strong>. Current slot: {rescheduleTarget.appointmentDate} at {rescheduleTarget.appointmentTime}.
            </p>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Available Slots ({openSlots.length} available)
                </label>
                {openSlots.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    No slots open on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                    {openSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition ${
                          selectedSlot === slot
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reschedulingLoading || !selectedSlot}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {reschedulingLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Viewer Modal */}
      {viewingPrescription && (
        <PrescriptionModal
          prescription={viewingPrescription}
          onClose={() => setViewingPrescription(null)}
        />
      )}
    </div>
  );
};
