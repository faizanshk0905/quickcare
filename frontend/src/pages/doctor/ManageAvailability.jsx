import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  AlertCircle,
  RefreshCw,
  Ban,
} from 'lucide-react';

export const ManageAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 05:00 PM');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Fetch Doctor profile
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await doctorService.getMyDoctorProfile();
        if (res && res.data) {
          setDoctor(res.data);
          if (res.data.workingHours) setWorkingHours(res.data.workingHours);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDoc();
  }, []);

  // Fetch Availability for selected date
  const fetchAvailability = async () => {
    if (!doctor?.doctorId || !selectedDate) return;
    try {
      setLoading(true);
      const res = await doctorService.getDoctorAvailability(doctor.doctorId, selectedDate);
      if (res && res.data) {
        setAvailability(res.data);
        setSlots(res.data.availableSlots || []);
        if (res.data.workingHours) setWorkingHours(res.data.workingHours);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctor?.doctorId) {
      fetchAvailability();
    }
  }, [doctor, selectedDate]);

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlot.trim()) return;
    if (slots.includes(newSlot.trim())) {
      setError('This time slot is already added.');
      return;
    }
    setSlots([...slots, newSlot.trim()]);
    setNewSlot('');
    setError('');
  };

  const handleRemoveSlot = (slotToRemove) => {
    setSlots(slots.filter((s) => s !== slotToRemove));
  };

  const handleGenerateStandard = () => {
    const standard = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
    ];
    setSlots(standard);
  };

  const handleBlockDate = () => {
    setSlots([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const res = await doctorService.updateAvailability({
        doctorId: doctor.doctorId,
        date: selectedDate,
        availableSlots: slots,
        workingHours,
      });
      if (res && res.success) {
        setMsg(`Availability for ${selectedDate} updated successfully!`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Manage Availability & Slots</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure your working hours, add or remove appointment time slots, and block dates.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Date Selector & Working Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Schedule Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Daily Working Hours</label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="e.g. 09:00 AM - 05:00 PM"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Slot Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-bold text-slate-700">Quick Slot Actions:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateStandard}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-teal-700 hover:bg-teal-50 rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate Standard 10 Slots
            </button>
            <button
              onClick={handleBlockDate}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" /> Block Entire Date
            </button>
          </div>
        </div>

        {/* Add Custom Slot */}
        <form onSubmit={handleAddSlot} className="flex gap-2">
          <input
            type="text"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            placeholder="Add custom slot, e.g. 05:30 PM"
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </form>

        {/* Slots Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Active Available Slots for {selectedDate} ({slots.length})
          </label>
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
              No slots configured. Patients will see this date as fully booked or blocked.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {slots.map((slot) => (
                <div
                  key={slot}
                  className="p-2.5 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800 group transition"
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-600" />
                    {slot}
                  </span>
                  <button
                    onClick={() => handleRemoveSlot(slot)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                    title="Remove slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Availability Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            {saving ? 'Saving...' : 'Save Availability for Selected Date'}
          </button>
        </div>
      </div>
    </div>
  );
};
