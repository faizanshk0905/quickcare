import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import {
  Stethoscope,
  Award,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Sparkles,
  Check,
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

export const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getMyDoctorProfile();
        if (res && res.data) {
          const docData = res.data;
          if (!docData.gender) {
            docData.gender = 'Female';
          }
          setProfile(docData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setProfile((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleGenderSelect = (selectedGender) => {
    setProfile((prev) => {
      const isCurrentFemale = FEMALE_AVATARS.some((a) => a.url === prev?.profileImage);
      const isCurrentMale = MALE_AVATARS.some((a) => a.url === prev?.profileImage);

      let nextImage = prev?.profileImage;
      if (selectedGender === 'Female' && (isCurrentMale || !prev?.profileImage)) {
        nextImage = FEMALE_AVATARS[0].url;
      } else if (selectedGender === 'Male' && (isCurrentFemale || !prev?.profileImage)) {
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
        setProfile((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const res = await doctorService.updateDoctorProfile(profile);
      if (res && res.data) {
        setProfile(res.data);
        setMsg('Doctor profile, photo, and practitioner details updated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading profile...</div>;
  }

  const activePresets = profile?.gender === 'Male' ? MALE_AVATARS : FEMALE_AVATARS;
  const currentAvatar =
    profile?.profileImage ||
    (profile?.gender === 'Male' ? MALE_AVATARS[0].url : FEMALE_AVATARS[0].url);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Doctor Profile Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your photo, gender identity, clinical credentials, and patient-facing consultation details.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PROFILE PHOTO & GENDER CARD */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-teal-50/50 border border-blue-100 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100/70 pb-2">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                Profile Photo & Gender
              </span>
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                Reg: {profile?.medicalRegistrationNumber} ({profile?.verificationStatus})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={currentAvatar}
                  alt={profile?.fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-blue-200"
                />
                <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-xs cursor-pointer transition">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Doctor Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'Female', label: 'Female', icon: '👩‍⚕️' },
                    { val: 'Male', label: 'Male', icon: '👨‍⚕️' },
                    { val: 'Other', label: 'Other', icon: '🧑‍⚕️' },
                  ].map((g) => {
                    const isSelected = profile?.gender === g.val;
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
                  Select gender to automatically update doctor badges and gender-tailored default avatars.
                </p>
              </div>
            </div>

            {/* Presets and Upload */}
            <div className="space-y-2 pt-2 border-t border-blue-100/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Select Avatar Preset for {profile?.gender || 'Doctor'}:
                </span>
                <label className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Upload Photo</span>
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
                  const isPicked = profile?.profileImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfile((prev) => ({ ...prev, profileImage: preset.url }))}
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
                  value={profile?.profileImage || ''}
                  onChange={handleChange}
                  placeholder="Or paste external photo link (https://...)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={profile?.fullName || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={profile?.specialization || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
              <input
                type="text"
                name="qualification"
                value={profile?.qualification || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                name="consultationFee"
                value={profile?.consultationFee || 500}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                name="experience"
                value={profile?.experience || 0}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clinic Address / Hospital Name
            </label>
            <input
              type="text"
              name="clinicAddress"
              value={profile?.clinicAddress || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio</label>
            <textarea
              rows="3"
              name="bio"
              value={profile?.bio || ''}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
