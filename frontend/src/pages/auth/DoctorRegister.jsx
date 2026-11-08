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
  Camera,
  Upload,
  Check,
  Sparkles,
} from 'lucide-react';

const FEMALE_AVATARS = [
  {
    id: 'f1',
    label: 'Female Doctor 1',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'f2',
    label: 'Female Doctor 2',
    url: 'https://images.unsplash.com/photo-1594824813583-43efb8e23528?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'f3',
    label: 'Female Doctor 3',
    url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400',
  },
];

const MALE_AVATARS = [
  {
    id: 'm1',
    label: 'Male Doctor 1',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'm2',
    label: 'Male Doctor 2',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'm3',
    label: 'Male Doctor 3',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
  },
];

export const DoctorRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Female',
    profileImage: FEMALE_AVATARS[0].url,
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

  const handleGenderSelect = (selectedGender) => {
    setFormData((prev) => {
      // If profileImage matches one of the opposite gender's avatars, switch to a matching default
      const isCurrentFemale = FEMALE_AVATARS.some((a) => a.url === prev.profileImage);
      const isCurrentMale = MALE_AVATARS.some((a) => a.url === prev.profileImage);

      let nextImage = prev.profileImage;
      if (selectedGender === 'Female' && (isCurrentMale || !prev.profileImage)) {
        nextImage = FEMALE_AVATARS[0].url;
      } else if (selectedGender === 'Male' && (isCurrentFemale || !prev.profileImage)) {
        nextImage = MALE_AVATARS[0].url;
      }

      return {
        ...prev,
        gender: selectedGender,
        profileImage: nextImage,
      };
    });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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
            Thank you, <strong>Dr. {formData.fullName}</strong>. Your medical credentials, {formData.gender} practitioner profile, and license{' '}
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

  const activePresets = formData.gender === 'Female' ? FEMALE_AVATARS : MALE_AVATARS;

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
            Join our certified telehealth panel. Set up your medical profile, gender identity, and professional photo.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. PRACTITIONER PHOTO & GENDER IDENTITY CARD */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-teal-50/40 border border-blue-100 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100/70 pb-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Practitioner Photo & Gender Identity
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  Required
                </span>
              </div>

              {/* Photo Preview + Gender Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Live Circular Avatar Preview */}
                <div className="relative group shrink-0">
                  <img
                    src={
                      formData.profileImage ||
                      (formData.gender === 'Female' ? FEMALE_AVATARS[0].url : MALE_AVATARS[0].url)
                    }
                    alt="Doctor Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-blue-200"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Gender Radio Selector */}
                <div className="flex-1 w-full space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Practitioner Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'Female', label: 'Female', icon: '👩‍⚕️' },
                      { val: 'Male', label: 'Male', icon: '👨‍⚕️' },
                      { val: 'Other', label: 'Other', icon: '🧑‍⚕️' },
                    ].map((g) => {
                      const isSelected = formData.gender === g.val;
                      return (
                        <button
                          key={g.val}
                          type="button"
                          onClick={() => handleGenderSelect(g.val)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{g.icon}</span>
                          <span>{g.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Gender ensures patients are matched with their preferred physician and displays appropriate badges.
                  </p>
                </div>
              </div>

              {/* Avatar Presets & Custom Upload Options */}
              <div className="space-y-2 pt-2 border-t border-blue-100/70">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Quick Photo Presets for {formData.gender} Doctors:
                  </span>
                  <label className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {activePresets.map((preset) => {
                    const isPicked = formData.profileImage === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, profileImage: preset.url }))}
                        className={`p-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer text-left ${
                          isPicked
                            ? 'bg-white border-blue-600 ring-2 ring-blue-400'
                            : 'bg-white/80 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <span className="text-[10px] font-bold text-slate-700 truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <input
                    type="url"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleChange}
                    placeholder="Or paste custom image URL (https://...)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. NAME, EMAIL, PHONE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
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

            {/* 3. SPECIALIZATION, QUALIFICATIONS, REG NUMBER */}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications *</label>
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

            {/* 4. EXPERIENCE, FEE, WORKING HOURS */}
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

            {/* 5. CLINIC ADDRESS & BIO */}
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

            {/* 6. PASSWORD */}
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
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-teal-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Submitting Credentials...' : 'Submit Doctor Profile for Verification'}
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
