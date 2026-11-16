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
  FileText,
  Eye,
  Download,
  X,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

export const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Certificate Preview Modal State
  const [previewDoctor, setPreviewDoctor] = useState(null);

  // Rejection Modal State
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(
    'Medical registration number could not be validated with State Medical Council records.'
  );
  const [customRejection, setCustomRejection] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Full Details Drawer
  const [detailDoctor, setDetailDoctor] = useState(null);

  const fetchDoctors = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await adminService.getAllDoctors();
      if (res && res.data) {
        setDoctors(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(true);

    const interval = setInterval(() => {
      fetchDoctors(false);
    }, 2500);

    const handleDoctorUpdate = () => fetchDoctors(false);
    window.addEventListener('quickcare_doctors_updated', handleDoctorUpdate);
    window.addEventListener('storage', handleDoctorUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('quickcare_doctors_updated', handleDoctorUpdate);
      window.removeEventListener('storage', handleDoctorUpdate);
    };
  }, []);

  const handleApprove = async (doctorId) => {
    setUpdatingId(doctorId);
    try {
      setDoctors((prev) =>
        prev.map((d) =>
          d.doctorId === doctorId || d.uid === doctorId
            ? { ...d, verificationStatus: 'VERIFIED', approvalStatus: 'VERIFIED', isRecentlyAdded: false, rejectionReason: '' }
            : d
        )
      );
      await adminService.verifyDoctor(doctorId, true, 'Qualifications and registration verified by medical board.');
      if (detailDoctor && (detailDoctor.doctorId === doctorId || detailDoctor.uid === doctorId)) {
        setDetailDoctor((prev) => ({ ...prev, verificationStatus: 'VERIFIED', approvalStatus: 'VERIFIED' }));
      }
      fetchDoctors(false);
    } catch (err) {
      console.warn('Verify update notice:', err.message);
      fetchDoctors(false);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenRejectModal = (doc) => {
    setRejectionTarget(doc);
    setRejectionReason(
      'Medical registration number could not be validated with State Medical Council records.'
    );
    setCustomRejection('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionTarget) return;

    const finalReason = customRejection.trim() || rejectionReason;
    const targetId = rejectionTarget.doctorId || rejectionTarget.uid;

    setSubmittingRejection(true);
    setUpdatingId(targetId);
    try {
      setDoctors((prev) =>
        prev.map((d) =>
          d.doctorId === targetId || d.uid === targetId
            ? {
                ...d,
                verificationStatus: 'REJECTED',
                approvalStatus: 'REJECTED',
                rejectionReason: finalReason,
                isRecentlyAdded: false,
              }
            : d
        )
      );
      await adminService.verifyDoctor(targetId, false, finalReason);
      if (detailDoctor && (detailDoctor.doctorId === targetId || detailDoctor.uid === targetId)) {
        setDetailDoctor((prev) => ({
          ...prev,
          verificationStatus: 'REJECTED',
          approvalStatus: 'REJECTED',
          rejectionReason: finalReason,
        }));
      }
      setRejectionTarget(null);
      fetchDoctors(false);
    } catch (err) {
      console.warn('Reject notice:', err.message);
      fetchDoctors(false);
    } finally {
      setSubmittingRejection(false);
      setUpdatingId(null);
    }
  };

  const downloadCertificate = (doc) => {
    if (!doc) return;
    const filename = doc.certificateFileName || `${doc.fullName || 'doctor'}_qualification_certificate.pdf`;

    if (doc.certificateBase64) {
      const a = document.createElement('a');
      a.href = doc.certificateBase64;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (doc.certificatePath && doc.certificatePath.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.certificatePath;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Backend endpoint streaming
    const url = `/api/doctors/${doc.doctorId || doc.uid}/certificate`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = doctors.filter((doc) => {
    const status = doc.verificationStatus || doc.approvalStatus || 'PENDING';
    const matchesFilter = filter === 'ALL' || status === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      doc.fullName?.toLowerCase().includes(q) ||
      doc.email?.toLowerCase().includes(q) ||
      doc.specialization?.toLowerCase().includes(q) ||
      doc.medicalRegistrationNumber?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = doctors.filter(
    (d) => (d.verificationStatus || d.approvalStatus) === 'PENDING'
  ).length;
  const verifiedCount = doctors.filter(
    (d) => (d.verificationStatus || d.approvalStatus) === 'VERIFIED'
  ).length;
  const rejectedCount = doctors.filter(
    (d) => (d.verificationStatus || d.approvalStatus) === 'REJECTED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800">
              Admin Portal
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Doctor Qualification & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review submitted medical qualification certificates, approve verified practitioners, or decline with feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchDoctors(true)}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh Doctor List Immediately"
          >
            <span>↻ Sync Now</span>
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, reg no..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 w-64 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'ALL', label: 'All Doctors', count: doctors.length },
          { id: 'PENDING', label: 'Pending Verification', count: pendingCount, alert: pendingCount > 0 },
          { id: 'VERIFIED', label: 'Verified & Approved', count: verifiedCount },
          { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 rounded-2xl font-bold transition shrink-0 flex items-center gap-2 cursor-pointer ${
              filter === tab.id
                ? 'bg-purple-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                filter === tab.id
                  ? 'bg-white text-purple-900'
                  : tab.alert
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Doctor Details</th>
                <th className="py-3.5 px-4">Specialization & Qual</th>
                <th className="py-3.5 px-4">Medical Reg No</th>
                <th className="py-3.5 px-4">Experience & Fee</th>
                <th className="py-3.5 px-4">Certificate Document</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading medical faculty roster...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No doctor applications match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const status = doc.verificationStatus || doc.approvalStatus || 'PENDING';
                  const isPending = status === 'PENDING';
                  const isVerified = status === 'VERIFIED';
                  const isRejected = status === 'REJECTED';
                  const hasCert = Boolean(
                    doc.certificateFileName || doc.certificatePath || doc.certificateBase64
                  );

                  return (
                    <tr key={doc.doctorId || doc.uid} className="hover:bg-slate-50/70 transition">
                      {/* Doctor Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              doc.profileImage ||
                              (doc.gender?.toLowerCase() === 'female'
                                ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'
                                : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100')
                            }
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setDetailDoctor(doc)}
                                className="font-extrabold text-slate-900 text-xs hover:text-purple-700 text-left transition cursor-pointer"
                              >
                                {doc.fullName}
                              </button>
                              {doc.isRecentlyAdded && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white animate-pulse shadow-xs">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{doc.email}</p>
                            {doc.phone && <p className="text-[10px] text-slate-400">{doc.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Specialization */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{doc.specialization}</span>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{doc.qualification}</p>
                      </td>

                      {/* Reg No */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {doc.medicalRegistrationNumber || 'MCI-PENDING'}
                        </span>
                      </td>

                      {/* Experience & Fee */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{doc.experience || 0} yrs</span>
                        <p className="text-slate-500 font-semibold">₹{doc.consultationFee || 500}</p>
                      </td>

                      {/* Certificate Document */}
                      <td className="py-3.5 px-4">
                        {hasCert ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setPreviewDoctor(doc)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition border border-blue-200 cursor-pointer shadow-xs"
                              title="Preview Uploaded Certificate"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="max-w-[110px] truncate">
                                {doc.certificateFileName || 'Certificate'}
                              </span>
                              <Eye className="w-3 h-3 text-blue-500" />
                            </button>
                            <button
                              onClick={() => downloadCertificate(doc)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="Download Certificate File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                            <Info className="w-3.5 h-3.5" />
                            Pre-verified Faculty
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600" /> PENDING
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                            {doc.rejectionReason && (
                              <p className="text-[10px] text-rose-600 max-w-[150px] truncate" title={doc.rejectionReason}>
                                {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenRejectModal(doc)}
                              disabled={updatingId === (doc.doctorId || doc.uid)}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(doc.doctorId || doc.uid)}
                              disabled={updatingId === (doc.doctorId || doc.uid)}
                              className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                            >
                              Approve
                            </button>
                          </>
                        )}

                        {isVerified && (
                          <button
                            onClick={() => handleOpenRejectModal(doc)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            Revoke
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() => handleApprove(doc.doctorId || doc.uid)}
                            className="px-3 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-emerald-200"
                          >
                            Re-approve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          CERTIFICATE PREVIEW MODAL
      ========================================================================= */}
      {previewDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Medical Qualification Document
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {previewDoctor.fullName} — Qualification Certificate
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registration Number: <span className="font-mono font-bold text-slate-800">{previewDoctor.medicalRegistrationNumber}</span> • Specialization: {previewDoctor.specialization}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Info Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 truncate max-w-xs">
                  {previewDoctor.certificateFileName || 'qualification_certificate.pdf'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                {previewDoctor.certificateUploadedAt && (
                  <span>
                    Uploaded: {new Date(previewDoctor.certificateUploadedAt).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => downloadCertificate(previewDoctor)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="flex-1 min-h-[350px] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-slate-200">
              {(() => {
                const cert =
                  previewDoctor.certificateBase64 ||
                  (previewDoctor.certificatePath?.startsWith('data:') ? previewDoctor.certificatePath : null) ||
                  `/api/doctors/${previewDoctor.doctorId || previewDoctor.uid}/certificate`;

                const isPdf =
                  previewDoctor.certificateFileType?.includes('pdf') ||
                  previewDoctor.certificateFileName?.toLowerCase().endsWith('.pdf') ||
                  cert?.startsWith('data:application/pdf');

                if (isPdf) {
                  return (
                    <object
                      data={cert}
                      type="application/pdf"
                      className="w-full h-[400px] rounded-xl border border-slate-200 bg-white"
                    >
                      <iframe
                        src={cert}
                        title="Certificate PDF Preview"
                        className="w-full h-[400px] rounded-xl border-none"
                      />
                    </object>
                  );
                }

                return (
                  <img
                    src={cert}
                    alt="Qualification Certificate"
                    className="max-h-[400px] max-w-full object-contain rounded-xl shadow-xs"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Status:{' '}
                <span className="font-bold uppercase text-slate-800">
                  {previewDoctor.verificationStatus || 'PENDING'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenRejectModal(previewDoctor);
                    setPreviewDoctor(null);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    handleApprove(previewDoctor.doctorId || previewDoctor.uid);
                    setPreviewDoctor(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Approve Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REJECTION REASON MODAL
      ========================================================================= */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Decline Doctor Registration
                </h3>
              </div>
              <button
                onClick={() => setRejectionTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are declining the application for <span className="font-bold text-slate-900">{rejectionTarget.fullName}</span>. Please specify the reason below. The doctor will see this notice to resubmit documents.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Predefined Reason:
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Medical registration number could not be validated with State Medical Council records.">
                    Medical registration number not found in State Medical Council registry.
                  </option>
                  <option value="Uploaded qualification certificate is blurry, illegible, or incomplete.">
                    Uploaded qualification certificate is blurry, illegible, or incomplete.
                  </option>
                  <option value="Specialization degree does not match requested department.">
                    Specialization degree does not match requested department.
                  </option>
                  <option value="Certificate expired or issued by an unrecognized institution.">
                    Certificate expired or issued by an unrecognized institution.
                  </option>
                  <option value="Identity mismatch between government ID and medical council records.">
                    Identity mismatch between government ID and medical council records.
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Notes / Feedback (Optional):
                </label>
                <textarea
                  rows="3"
                  value={customRejection}
                  onChange={(e) => setCustomRejection(e.target.value)}
                  placeholder="Provide additional instructions on how the doctor can correct and resubmit their documents..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectionTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRejection}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
                >
                  {submittingRejection ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCTOR DETAILS DRAWER
      ========================================================================= */}
      {detailDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-lg p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Doctor Profile & Credentials
                </h3>
                <button
                  onClick={() => setDetailDoctor(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={
                    detailDoctor.profileImage ||
                    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120'
                  }
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{detailDoctor.fullName}</h4>
                  <p className="text-xs text-purple-700 font-bold">{detailDoctor.specialization}</p>
                  <p className="text-xs text-slate-500">{detailDoctor.email}</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Medical Reg No:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {detailDoctor.medicalRegistrationNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Qualification:</span>
                  <span className="font-bold text-slate-800">{detailDoctor.qualification}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Experience:</span>
                  <span className="font-bold text-slate-800">{detailDoctor.experience} years</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Consultation Fee:</span>
                  <span className="font-bold text-slate-800">₹{detailDoctor.consultationFee}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Clinic / Hospital:</span>
                  <span className="font-bold text-slate-800">{detailDoctor.clinicAddress || 'QuickCare Clinic'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="font-bold uppercase text-purple-800">
                    {detailDoctor.verificationStatus || 'PENDING'}
                  </span>
                </div>
              </div>

              {detailDoctor.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                  <span className="font-extrabold uppercase text-[10px] text-rose-600">Rejection Reason:</span>
                  <p>{detailDoctor.rejectionReason}</p>
                </div>
              )}

              {/* Certificate preview quick trigger */}
              {(detailDoctor.certificateFileName || detailDoctor.certificateBase64 || detailDoctor.certificatePath) && (
                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Uploaded Qualification Certificate
                    </span>
                    <button
                      onClick={() => setPreviewDoctor(detailDoctor)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                    >
                      Open Full Preview
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate font-mono">
                    {detailDoctor.certificateFileName || 'qualification_certificate.pdf'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  handleOpenRejectModal(detailDoctor);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition text-center"
              >
                Reject Application
              </button>
              <button
                onClick={() => {
                  handleApprove(detailDoctor.doctorId || detailDoctor.uid);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition text-center"
              >
                Approve Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
