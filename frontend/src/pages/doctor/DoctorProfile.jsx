import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import { Stethoscope, Award, MapPin, Clock, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

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
          setProfile(res.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const res = await doctorService.updateDoctorProfile(profile);
      if (res && res.data) {
        setMsg('Doctor profile updated successfully.');
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Doctor Profile Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage clinical credentials, consultation fees, and public profile details.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={
                profile?.profileImage ||
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200'
              }
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{profile?.fullName}</h3>
              <p className="text-xs text-teal-700 font-semibold">{profile?.specialization}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Reg: {profile?.medicalRegistrationNumber} ({profile?.verificationStatus})
              </p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Profile Photo URL
            </label>
            <input
              type="url"
              name="profileImage"
              value={profile?.profileImage || ''}
              onChange={handleChange}
              placeholder="https://..."
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
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
