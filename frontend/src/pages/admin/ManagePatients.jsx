import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Users, Search, Mail, Phone, Calendar, MapPin, Shield } from 'lucide-react';

export const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllPatients();
      if (res && res.data) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filtered = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Manage Registered Patients</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review patient accounts, contact details, and platform registration history.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Date of Birth & Gender</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Account ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading registered patients...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No patients match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((pat) => (
                  <tr key={pat.patientId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                          {pat.fullName?.charAt(0) || 'P'}
                        </div>
                        <span className="font-bold text-slate-900">{pat.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{pat.email}</td>
                    <td className="py-3.5 px-4 font-mono">{pat.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{pat.dateOfBirth}</span>
                      <p className="text-[10px] text-slate-400">{pat.gender}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">{pat.address || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {pat.patientId}
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
