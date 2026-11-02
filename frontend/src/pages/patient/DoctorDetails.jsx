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
} from 'lucide-react';

export const DoctorDetails = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

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

  // Load Doctor Availability for chosen date
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!doctorId || !selectedDate) return;
      try {
        const res = await doctorService.getDoctorAvailability(doctorId, selectedDate);
        if (res && res.data) {
          setAvailability(res.data);
          setSelectedSlot('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAvailability();
  }, [doctorId, selectedDate]);

  const handleBooking = async (e) => {
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

    if (!reason.trim()) {
      setBookingError('Please provide a reason or symptoms for the visit.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await appointmentService.bookAppointment({
        doctorId,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        consultationType,
        reason,
      });

      if (res && res.success) {
        setBookingSuccess(true);
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message || err.message || 'Failed to book appointment. Please try another slot.'
      );
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

  const bookedSlots = availability?.bookedSlots || [];
  const openSlots = (availability?.availableSlots || []).filter(
    (slot) => !bookedSlots.includes(slot)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        to="/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Doctor Profile Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={
                  doctor.profileImage ||
                  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
                }
                alt={doctor.fullName}
                className="w-32 h-32 rounded-3xl object-cover border border-slate-100 shadow-md shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                    {doctor.specialization}
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
                </div>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs leading-relaxed text-slate-600">
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
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Working Hours</span>
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
                  Appointment Request Sent!
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your appointment request for <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong> has been saved. Dr. {doctor.fullName} will review and confirm.
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
              <form onSubmit={handleBooking} className="space-y-4">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
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
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                        consultationType === 'VIDEO'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" /> Video Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultationType('IN_PERSON')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                        consultationType === 'IN_PERSON'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" /> Clinic Visit
                    </button>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Available Time Slots ({openSlots.length} open)
                  </label>
                  {openSlots.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      No open slots on this date. Please select another date above.
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
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Symptoms / Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reason for Consultation / Symptoms
                  </label>
                  <textarea
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe your symptoms or medical concern..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || openSlots.length === 0}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition active:scale-95"
                >
                  {bookingLoading ? 'Securing Slot...' : 'Confirm Appointment'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
