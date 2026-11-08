import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  Stethoscope,
  Search,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Award,
} from 'lucide-react';

export const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllDoctors();
      if (res && res.data) {
        setDoctors(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleVerify = async (doctorId, approve) => {
    setUpdatingId(doctorId);
    try {
      await adminService.verifyDoctor(
        doctorId,
        approve,
        approve ? 'Credentials verified' : 'Medical Board rejected application'
      );
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Verification update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(userId, nextStatus);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed.');
    }
  };

  const filtered = doctors.filter((doc) => {
    const matchesFilter = filter === 'ALL' || doc.verificationStatus === filter;
    const matchesSearch =
      !search.trim() ||
      doc.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.medicalRegistrationNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Manage Doctors & Faculty</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review qualifications, approve or decline practitioner applications, and manage clinical accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, spec, reg no..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {['ALL', 'VERIFIED', 'PENDING', 'REJECTED'].map((tab) => {
          const count =
            tab === 'ALL'
              ? doctors.length
              : doctors.filter((d) => d.verificationStatus === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-2xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === tab ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Registration No</th>
                <th className="py-3.5 px-4">Experience & Fee</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading medical faculty...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No doctors match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            doc.profileImage ||
                            (doc.gender?.toLowerCase() === 'male'
                              ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'
                              : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100')
                          }
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-slate-900 text-xs">{doc.fullName}</p>
                            {doc.gender && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {doc.gender === 'Female' ? '♀' : doc.gender === 'Male' ? '♂' : doc.gender}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">{doc.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {doc.specialization}
                      <p className="text-[10px] text-slate-400 font-normal">{doc.qualification}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {doc.medicalRegistrationNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{doc.experience} yrs</span>
                      <p className="text-slate-500">₹{doc.consultationFee}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : doc.verificationStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <ShieldAlert className="w-3 h-3" /> PENDING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {doc.verificationStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleVerify(doc.doctorId, false)}
                            disabled={updatingId === doc.doctorId}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleVerify(doc.doctorId, true)}
                            disabled={updatingId === doc.doctorId}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {doc.verificationStatus === 'VERIFIED' && (
                        <button
                          onClick={() => handleVerify(doc.doctorId, false)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          Revoke Verification
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
