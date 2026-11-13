import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import {
  Star,
  Award,
  MapPin,
  Clock,
  Calendar,
  Video,
  Building,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Zap,
  Check,
  X,
  Radio,
} from 'lucide-react';

export const DoctorDetails = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const authContext = useAuth() || {};
  const { user = null, isAuthenticated = false, role = null } = authContext;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consultationType, setConsultationType] = useState('VIDEO');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Live IST Clock
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

  // Today's date string in Asia/Kolkata
  const todayInKolkata = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const isToday = selectedDate === todayInKolkata;

  // Load Doctor Profile
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getDoctorById(doctorId);
        if (res && res.data) {
          setDoctor(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [doctorId]);

  // Load Doctor Availability for chosen date with Real-Time Polling (Double-booking prevention)
  const fetchAvailability = async (isBackground = false) => {
    if (!doctorId || !selectedDate) return;
    try {
      const res = await doctorService.getDoctorAvailability(doctorId, selectedDate);
      if (res && res.data) {
        setAvailability(res.data);
        // Real-Time Collision Check: If selected slot was booked by another patient while viewing
        if (selectedSlot && res.data.bookedSlots?.includes(selectedSlot)) {
          setSelectedSlot('');
          setShowConfirmModal(false);
          setBookingError('This appointment slot has just been booked. Please select another slot.');
        }
      }
    } catch (err) {
      if (!isBackground) console.error(err);
    }
  };

  useEffect(() => {
    fetchAvailability(false);
    setSelectedSlot('');
    setBookingError('');

    // Real-time synchronization interval (every 3 seconds for instant double-booking detection)
    const interval = setInterval(() => {
      fetchAvailability(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [doctorId, selectedDate]);

  // Helper to convert "hh:mm a" to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    const parts = timeStr.trim().split(' ');
    if (parts.length < 2) return -1;
    let [h, m] = parts[0].split(':').map(Number);
    const period = parts[1].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  // Get current minutes in Asia/Kolkata
  const getKolkataCurrentMinutes = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    });
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Filter slots dynamically
  const bookedSlots = availability?.bookedSlots || [];
  const rawSlots = availability?.availableSlots || [];
  const nowKolkataMinutes = getKolkataCurrentMinutes();

  // If today: strictly hide past slots
  const validSlots = rawSlots.filter((slot) => {
    if (!isToday) return true;
    const slotM = parseTimeToMinutes(slot);
    return slotM > nowKolkataMinutes;
  });

  const availableSlotsOnly = validSlots.filter((slot) => !bookedSlots.includes(slot));

  const handleOpenBookingModal = (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/doctors/${doctorId}` } });
      return;
    }

    if (role !== 'PATIENT') {
      setBookingError('Appointments can only be booked through a patient account.');
      return;
    }

    if (!selectedSlot) {
      setBookingError('Please select an available time slot.');
      return;
    }

    // Double check if selected slot is in the past for today
    if (isToday) {
      const slotM = parseTimeToMinutes(selectedSlot);
      if (slotM <= getKolkataCurrentMinutes()) {
        setBookingError('This time slot has already passed. Please select a future slot.');
        setSelectedSlot('');
        return;
      }
    }

    // Double check if booked
    if (bookedSlots.includes(selectedSlot)) {
      setBookingError('This appointment slot has just been booked. Please select another slot.');
      setSelectedSlot('');
      return;
    }

    if (!reason.trim()) {
      setBookingError('Please provide a reason or symptoms for the visit.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    setBookingError('');
    let patientFullName = user?.fullName;
    let patientEmail = user?.email;
    if (!patientFullName || !patientEmail) {
      try {
        const stored = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          patientFullName = patientFullName || parsed?.fullName;
          patientEmail = patientEmail || parsed?.email;
        }
      } catch (e) {
        // fallback ignored
      }
    }

    try {
      const res = await appointmentService.bookAppointment({
        doctorId,
        doctorName: doctor?.fullName || 'Doctor',
        doctorSpecialization: doctor?.specialization || 'General',
        patientName: patientFullName || 'Patient Aarav Sharma',
        patientEmail: patientEmail || 'patient@quickcare.com',
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        consultationType,
        consultationFee: doctor?.consultationFee || 500,
        reason,
      });

      if (res && res.success) {
        setShowConfirmModal(false);
        setBookingSuccess(true);
        fetchAvailability(false);
      }
    } catch (err) {
      setShowConfirmModal(false);
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg.toLowerCase().includes('booked')) {
        setBookingError('This appointment slot has just been booked. Please select another slot.');
      } else {
        setBookingError(errorMsg || 'Failed to book appointment. Please try another slot.');
      }
      setSelectedSlot('');
      fetchAvailability(false);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading specialist profile...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-24 text-center text-slate-500">
        Doctor profile not found.
      </div>
    );
  }

  const slotInterval = doctor.slotDurationMinutes || 15;

  // Doctor Online Status
  const getDoctorStatusMeta = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONLINE':
        return { label: 'Online', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
      case 'BUSY':
        return { label: 'In Consultation', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
      case 'OFFLINE':
        return { label: 'Offline', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
      default:
        return { label: '24/7 Video Available', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500 animate-pulse' };
    }
  };

  const statusMeta = getDoctorStatusMeta(doctor.onlineStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Live Clock */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
        </Link>

        {/* Real-Time Indian Standard Time Clock */}
        <div className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white border border-slate-700 shadow-xs flex items-center gap-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Indian Standard Time (IST):</span>
          <span className="font-mono text-emerald-300 font-bold tracking-wider">{istTime || 'Loading...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Doctor Profile Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {(() => {
                const isMale = doctor.gender?.toLowerCase() === 'male';
                const defaultFallback = isMale
                  ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
                  : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400';
                return (
                  <img
                    src={doctor.profileImage || defaultFallback}
                    alt={doctor.fullName}
                    className="w-32 h-32 rounded-3xl object-cover border border-slate-100 shadow-md shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultFallback;
                    }}
                  />
                );
              })()}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                    {doctor.specialization}
                  </span>
                  {/* Real-time Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                    <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </span>
                  {doctor.verificationStatus === 'VERIFIED' && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Practitioner
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {doctor.fullName}
                </h1>

                <p className="text-xs font-medium text-slate-600">{doctor.qualification}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {doctor.rating ? doctor.rating.toFixed(1) : '4.8'} ({doctor.reviewCount || 48} reviews)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-teal-600" />
                    {doctor.experience} Years Experience
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <Zap className="w-4 h-4 text-blue-500" />
                    {slotInterval}-Min Dynamic Slots
                  </span>
                </div>
              </div>
            </div>

            {/* 24/7 Video Consultation Indicator Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 border border-teal-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/30">
                <Video className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-teal-900">24/7 Video Consultation Available</span>
                  <span className="px-2 py-0.5 bg-teal-200/70 text-teal-800 text-[10px] font-bold rounded-md">Round-the-Clock</span>
                </div>
                <p className="text-teal-700 mt-0.5">
                  Request immediate care or schedule consultations anytime, including nights, weekends, and holidays.
                </p>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs leading-relaxed text-slate-600">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">About Doctor</h3>
                <p>{doctor.bio || 'Experienced medical practitioner dedicated to evidence-based healthcare.'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Clinic Address</span>
                    <span className="font-semibold text-slate-800">{doctor.clinicAddress || 'QuickCare Clinic'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">In-Clinic Hours</span>
                    <span className="font-semibold text-slate-800">{doctor.workingHours || '09:00 AM - 05:00 PM'}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Medical Registration</span>
                <span className="font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {doctor.medicalRegistrationNumber || 'MCI-APPROVED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl sticky top-24 space-y-6">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                Appointment Booking
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <h2 className="text-xl font-extrabold text-slate-900">Schedule Consultation</h2>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-normal">Fee: </span>
                  <span className="text-xl font-black text-slate-900">₹{doctor.consultationFee}</span>
                </div>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-emerald-900">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your appointment for <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong> has been secured with Dr. {doctor.fullName}.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/patient/appointments"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    View My Appointments
                  </Link>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setSelectedSlot('');
                      setReason('');
                    }}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    Book Another Slot
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOpenBookingModal} className="space-y-4">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Select Consultation Date
                    </label>
                    {isToday && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Today (Future Slots Only)
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    min={todayInKolkata}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Consultation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setConsultationType('VIDEO')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition ${
                        consultationType === 'VIDEO'
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-blue-600" />
                        <span>24/7 Video Call</span>
                      </div>
                      <span className="text-[9px] font-normal text-blue-600/80">Anytime Anywhere</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultationType('IN_PERSON')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold transition ${
                        consultationType === 'IN_PERSON'
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-teal-600" />
                        <span>Clinic Visit</span>
                      </div>
                      <span className="text-[9px] font-normal text-slate-500">Working Hours Only</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Real-Time Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {slotInterval}-Min Slots ({availableSlotsOnly.length} available)
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Dynamic
                    </span>
                  </div>

                  {/* Doctor Schedule Context */}
                  <div className="mb-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                    <span>🕒 Working: {doctor.workingHours || '09:00 AM - 05:00 PM'}</span>
                    <span>☕ Break: {doctor.breakStartTime || '01:00 PM'} - {doctor.breakEndTime || '02:00 PM'}</span>
                  </div>

                  {availability?.holiday ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-medium">
                      🏖️ Dr. {doctor.fullName} is on scheduled holiday on this date.
                    </div>
                  ) : validSlots.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      {isToday
                        ? 'All clinic appointment slots for today have passed. Please select a future date.'
                        : 'No open slots on this date. Please select another date.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {validSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlot === slot;

                        if (isBooked) {
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled
                              title="This slot is already booked"
                              className="py-2 px-1 text-[11px] font-semibold rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed flex flex-col items-center justify-center opacity-60"
                            >
                              <span>{slot}</span>
                              <span className="text-[8px] font-bold text-rose-500 uppercase">Booked</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <span>{slot}</span>
                            <span className={`text-[8px] ${isSelected ? 'text-blue-100' : 'text-emerald-600'} font-semibold uppercase`}>
                              Available
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Symptoms / Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reason for Consultation / Symptoms
                  </label>
                  <textarea
                    rows="2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe your symptoms or medical concern..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || !selectedSlot}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition active:scale-95"
                >
                  Review & Book Appointment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Booking Summary Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                  Booking Summary
                </span>
                <h3 className="text-lg font-black text-slate-900">Confirm Your Consultation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Specialist</span>
                  <span className="font-bold text-slate-900">{doctor.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Specialization</span>
                  <span className="font-bold text-blue-600">{doctor.specialization}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Date & Time</span>
                  <span className="font-bold text-slate-900">{selectedDate} at {selectedSlot}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">Consultation Type</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    {consultationType === 'VIDEO' ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-blue-600" /> 24/7 Video Consultation
                      </>
                    ) : (
                      <>
                        <Building className="w-3.5 h-3.5 text-teal-600" /> Clinic Visit
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Consultation Fee</span>
                  <span className="font-black text-base text-slate-900">₹{doctor.consultationFee}</span>
                </div>
              </div>

              {reason && (
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Symptoms / Reason
                  </span>
                  <p className="text-slate-700 leading-snug">{reason}</p>
                </div>
              )}

              {consultationType === 'VIDEO' && (
                <p className="text-[11px] text-teal-700 bg-teal-50 p-2.5 rounded-xl border border-teal-200 leading-tight">
                  📹 An authorized Google Meet video link will be generated instantly and dispatched to your email.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Change Details
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-1.5"
              >
                {bookingLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Securing Slot...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};