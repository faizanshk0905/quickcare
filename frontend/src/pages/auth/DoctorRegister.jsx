import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  User,
  Mail,
  Phone,
  Lock,
  Award,
  Building,
  DollarSign,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const DoctorRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialization: 'General Physician',
    qualification: 'MBBS, MD',
    experience: 5,
    medicalRegistrationNumber: '',
    consultationFee: 500,
    workingHours: '09:00 AM - 05:00 PM',
    clinicAddress: '',
    bio: '',
    role: 'DOCTOR',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successPending, setSuccessPending] = useState(false);

  const specializations = [
    'General Physician',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'Dentistry',
    'Psychiatry',
    'ENT Specialist',
    'Ophthalmology',
  ];

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.medicalRegistrationNumber.trim()) {
      setError('Medical Council Registration number is required for verification.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      setSuccessPending(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (successPending) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Registration Under Review</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Thank you, <strong>Dr. {formData.fullName}</strong>. Your medical credentials and license{' '}
            <span className="font-mono font-bold text-slate-800">({formData.medicalRegistrationNumber})</span>{' '}
            have been submitted for Administrative Medical Board Verification.
          </p>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
            Once approved by the Chief Administrator, your profile will become active and available in patient searches.
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-teal-500/25">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Doctor Practitioner Registration
          </h2>
          <p className="text-xs text-slate-500">
            Join our certified telehealth panel. Profiles are verified by the Medical Board.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name, Email, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Dr. Full Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@hospital.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98200 11223"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Specialization, Qualifications, Registration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold"
                >
                  {specializations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g. MBBS, MD, DM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medical Reg Number *
                </label>
                <input
                  type="text"
                  name="medicalRegistrationNumber"
                  value={formData.medicalRegistrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. MCI-98745"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Experience, Fee, Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Working Hours</label>
                <input
                  type="text"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  placeholder="09:00 AM - 05:00 PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Clinic Address & Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinic / Hospital Affiliation</label>
              <input
                type="text"
                name="clinicAddress"
                value={formData.clinicAddress}
                onChange={handleChange}
                placeholder="Hospital / Clinic Name & City"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio</label>
              <textarea
                rows="2"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief clinical background and focus areas..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-teal-500/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting Credentials...' : 'Submit Profile for Verification'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-800">
              Sign In to Doctor Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
