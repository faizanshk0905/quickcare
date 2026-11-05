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
  Coffee,
  Check,
} from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ManageAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [newSlot, setNewSlot] = useState('');
  
  // Working Schedule State
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [workingStartTime, setWorkingStartTime] = useState('09:00 AM');
  const [workingEndTime, setWorkingEndTime] = useState('05:00 PM');
  const [breakStartTime, setBreakStartTime] = useState('01:00 PM');
  const [breakEndTime, setBreakEndTime] = useState('02:00 PM');
  const [slotDuration, setSlotDuration] = useState(15);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState('');

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
          if (res.data.availableDays && res.data.availableDays.length > 0) {
            setWorkingDays(res.data.availableDays);
          }
          if (res.data.workingStartTime) setWorkingStartTime(res.data.workingStartTime);
          if (res.data.workingEndTime) setWorkingEndTime(res.data.workingEndTime);
          if (res.data.breakStartTime) setBreakStartTime(res.data.breakStartTime);
          if (res.data.breakEndTime) setBreakEndTime(res.data.breakEndTime);
          if (res.data.slotDurationMinutes) setSlotDuration(res.data.slotDurationMinutes);
          if (res.data.holidays) setHolidays(res.data.holidays);
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
        setBookedSlots(res.data.bookedSlots || []);
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

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

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

  // Convert "hh:mm AM/PM" to minutes from midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const s = timeStr.trim().toUpperCase();
    const isPM = s.includes('PM');
    const isAM = s.includes('AM');
    const clean = s.replace('AM', '').replace('PM', '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  const minutesToTime = (totalMinutes) => {
    const h24 = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}:${mStr} ${ampm}`;
  };

  const handleGenerate15MinSlots = () => {
    const startMins = timeToMinutes(workingStartTime);
    const endMins = timeToMinutes(workingEndTime);
    const breakStartMins = timeToMinutes(breakStartTime);
    const breakEndMins = timeToMinutes(breakEndTime);

    const generated = [];
    let cur = startMins;

    while (cur + slotDuration <= endMins) {
      const slotEnd = cur + slotDuration;
      // Exclude break
      const inBreak =
        (cur >= breakStartMins && cur < breakEndMins) ||
        (slotEnd > breakStartMins && slotEnd <= breakEndMins);

      if (!inBreak) {
        generated.push(minutesToTime(cur));
      }
      cur = slotEnd;
    }

    setSlots(generated);
    setMsg(`Generated ${generated.length} automatic 15-minute slots! Click Save to apply.`);
  };

  const handleBlockDate = () => {
    setSlots([]);
    setMsg('All slots cleared for this date. Date is now blocked.');
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!newHoliday) return;
    if (holidays.includes(newHoliday)) {
      setError('Holiday already added.');
      return;
    }
    setHolidays([...holidays, newHoliday]);
    setNewHoliday('');
  };

  const handleRemoveHoliday = (h) => {
    setHolidays(holidays.filter((x) => x !== h));
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
        workingHours: `${workingStartTime} - ${workingEndTime}`,
        workingDays,
        workingStartTime,
        workingEndTime,
        breakStartTime,
        breakEndTime,
        slotDurationMinutes: slotDuration,
        holidays,
        timezone: 'Asia/Kolkata',
      });
      if (res && res.success) {
        setMsg(`Schedule & Availability updated successfully!`);
        fetchAvailability();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Working Schedule & 15-Minute Slot Configuration</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure working days, consultation duration, break timings, scheduled holidays, and automatic 15-minute appointment slots.
        </p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Global Working Schedule Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-600" />
          Doctor Consultation Schedule & Timing Rules
        </h2>

        {/* Working Days Checkboxes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Configured Working Days</label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const active = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{day}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Starting Time</label>
            <input
              type="text"
              value={workingStartTime}
              onChange={(e) => setWorkingStartTime(e.target.value)}
              placeholder="e.g. 09:00 AM"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Ending Time</label>
            <input
              type="text"
              value={workingEndTime}
              onChange={(e) => setWorkingEndTime(e.target.value)}
              placeholder="e.g. 05:00 PM"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Break Start Time</label>
            <input
              type="text"
              value={breakStartTime}
              onChange={(e) => setBreakStartTime(e.target.value)}
              placeholder="e.g. 01:00 PM"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Break End Time</label>
            <input
              type="text"
              value={breakEndTime}
              onChange={(e) => setBreakEndTime(e.target.value)}
              placeholder="e.g. 02:00 PM"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Slot Duration & Holidays */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Consultation Duration</label>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-2 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold rounded-xl">
                15 Minutes (Standard Clinical Interval)
              </span>
              <span className="text-[11px] text-slate-400">Strict 15-min intervals configured</span>
            </div>
          </div>

          {/* Scheduled Holidays */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Scheduled Holidays & Leave</label>
            <form onSubmit={handleAddHoliday} className="flex gap-2 mb-2">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Holiday
              </button>
            </form>
            {holidays.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {holidays.map((h) => (
                  <span
                    key={h}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>{h}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHoliday(h)}
                      className="text-amber-500 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Specific Date Slots & Generator */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Consultation Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate15MinSlots}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate 15-Min Slots for {selectedDate}
            </button>
            <button
              type="button"
              onClick={handleBlockDate}
              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" /> Block Date
            </button>
          </div>
        </div>

        {/* Add custom slot */}
        <form onSubmit={handleAddSlot} className="flex gap-2">
          <input
            type="text"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            placeholder="Add specific slot, e.g. 05:15 PM"
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </form>

        {/* Slots Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              Slots for {selectedDate} ({slots.length} total, {bookedSlots.length} booked)
            </label>
            <span className="text-[11px] text-slate-400">
              Break: {breakStartTime} - {breakEndTime} excluded
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
              No slots configured. Patients will see this date as blocked or on leave.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-80 overflow-y-auto p-1">
              {slots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <div
                    key={slot}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition group ${
                      isBooked
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3 h-3 ${isBooked ? 'text-rose-500' : 'text-teal-600'}`} />
                      {slot}
                      {isBooked && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded font-black uppercase">
                          Booked
                        </span>
                      )}
                    </span>
                    {!isBooked && (
                      <button
                        onClick={() => handleRemoveSlot(slot)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                        title="Remove slot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Saves schedule settings and applies 15-minute slot intervals.
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Availability & Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
