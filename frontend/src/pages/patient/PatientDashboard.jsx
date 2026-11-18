import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { notificationService } from '../../services/notificationService';
import { prescriptionService } from '../../services/prescriptionService';
import { DoctorCard } from '../../components/common/DoctorCard';
import { PrescriptionModal } from '../../components/common/PrescriptionModal';
import api from '../../services/api';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
  Video,
  User,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Filter,
  X,
  AlertCircle,
  LayoutDashboard,
  Stethoscope,
  ChevronRight,
  Upload,
  Camera,
  Activity,
  HeartPulse,
  LogOut,
  Menu,
  Eye,
  Pill,
  Download,
  FolderOpen,
  FileUp,
  Trash2,
} from 'lucide-react';

export const PatientDashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab from query param (?tab=overview|appointments|doctors|video|prescriptions|profile|notifications)
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [istTime, setIstTime] = useState('');

  // Appointments Filter State
  const [aptStatusFilter, setAptStatusFilter] = useState('ALL');
  const [aptSearch, setAptSearch] = useState('');

  // Selected Appointment for Details Modal
  const [selectedAptDetails, setSelectedAptDetails] = useState(null);

  // Cancellation Modal State
  const [cancelTargetApt, setCancelTargetApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('Personal schedule conflict');
  const [customCancelNotes, setCustomCancelNotes] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Copied Google Meet Link feedback state
  const [copiedMeetId, setCopiedMeetId] = useState(null);

  // Find Doctors Search & Filter State
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docSpecialtyFilter, setDocSpecialtyFilter] = useState('ALL');

  // Notifications Filter State
  const [notifFilter, setNotifFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || 'Male',
    address: user?.address || '',
    profileImage: user?.profileImage || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Sync profile form when user context updates
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || prev.age || '',
        gender: user.gender || prev.gender || 'Male',
        address: user.address || prev.address || '',
        profileImage: user.profileImage || prev.profileImage || '',
      }));
    }
  }, [user]);

  // Medical Records & Lab Reports Upload State (Patient-Isolated)
  const patientUid = user?.userId || user?.uid || (user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest');
  const [medicalRecords, setMedicalRecords] = useState(() => {
    try {
      const raw = localStorage.getItem(`quickcare_patient_records_${patientUid}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedViewingRecord, setSelectedViewingRecord] = useState(null);
  const [recordFilter, setRecordFilter] = useState('ALL');
  const [recordError, setRecordError] = useState('');
  const [recordForm, setRecordForm] = useState({
    title: '',
    category: 'Lab Report',
    date: new Date().toISOString().split('T')[0],
    fileData: null,
    fileName: '',
    fileSize: '',
    notes: '',
  });

  // Re-sync medical records when patientUid changes
  useEffect(() => {
    if (!patientUid) return;
    try {
      const raw = localStorage.getItem(`quickcare_patient_records_${patientUid}`);
      if (raw) {
        setMedicalRecords(JSON.parse(raw));
      } else {
        setMedicalRecords([]);
      }
    } catch (e) {}
  }, [patientUid]);

  const handleRecordFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setRecordError('File size exceeds 8MB limit.');
      return;
    }
    setRecordError('');
    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setRecordForm((prev) => ({
        ...prev,
        fileData: reader.result,
        fileName: file.name,
        fileSize: sizeStr,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    if (!recordForm.title.trim()) {
      setRecordError('Please provide a document title.');
      return;
    }
    if (!recordForm.fileData) {
      setRecordError('Please select a PDF or image file to upload.');
      return;
    }

    const newRecord = {
      recordId: `REC-${Date.now()}`,
      patientUid,
      patientName: user?.fullName || 'Patient',
      patientEmail: user?.email || '',
      title: recordForm.title.trim(),
      category: recordForm.category,
      date: recordForm.date,
      fileData: recordForm.fileData,
      fileName: recordForm.fileName,
      fileSize: recordForm.fileSize,
      notes: recordForm.notes.trim(),
      uploadedAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...medicalRecords];
    setMedicalRecords(updated);
    try {
      localStorage.setItem(`quickcare_patient_records_${patientUid}`, JSON.stringify(updated));
      // Store in shared records index so consulting doctors can lookup
      const sharedMapRaw = localStorage.getItem('quickcare_shared_patient_records');
      const sharedMap = sharedMapRaw ? JSON.parse(sharedMapRaw) : {};
      sharedMap[patientUid] = updated;
      if (user?.email) {
        sharedMap[user.email.toLowerCase()] = updated;
      }
      localStorage.setItem('quickcare_shared_patient_records', JSON.stringify(sharedMap));
      window.dispatchEvent(new CustomEvent('quickcare_records_updated', { detail: { patientUid } }));
    } catch (err) {
      console.warn('Storage quota warning:', err);
    }

    setRecordModalOpen(false);
    setRecordForm({
      title: '',
      category: 'Lab Report',
      date: new Date().toISOString().split('T')[0],
      fileData: null,
      fileName: '',
      fileSize: '',
      notes: '',
    });
    setRecordError('');
  };

  const handleDeleteRecord = (recordId) => {
    if (!window.confirm('Are you sure you want to delete this medical report?')) return;
    const filtered = medicalRecords.filter((r) => r.recordId !== recordId);
    setMedicalRecords(filtered);
    try {
      localStorage.setItem(`quickcare_patient_records_${patientUid}`, JSON.stringify(filtered));
      const sharedMapRaw = localStorage.getItem('quickcare_shared_patient_records');
      if (sharedMapRaw) {
        const sharedMap = JSON.parse(sharedMapRaw);
        sharedMap[patientUid] = filtered;
        if (user?.email) sharedMap[user.email.toLowerCase()] = filtered;
        localStorage.setItem('quickcare_shared_patient_records', JSON.stringify(sharedMap));
      }
    } catch (e) {}
  };

  const filteredRecords = useMemo(() => {
    if (recordFilter === 'ALL') return medicalRecords;
    return medicalRecords.filter((r) => r.category === recordFilter);
  }, [medicalRecords, recordFilter]);

  // Live IST Clock
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

  // Fetch all patient-scoped data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes, notifRes, rxRes] = await Promise.all([
        appointmentService.getPatientAppointments().catch(() => ({ data: [] })),
        doctorService.searchDoctors().catch(() => ({ data: [] })),
        notificationService.getNotifications().catch(() => ({ data: [] })),
        prescriptionService.getPatientPrescriptions().catch(() => ({ data: [] })),
      ]);

      if (aptRes && Array.isArray(aptRes.data)) {
        setAppointments(aptRes.data);
      }
      if (docRes && Array.isArray(docRes.data)) {
        // Only include verified and approved doctors
        const verifiedOnly = docRes.data.filter(
          (d) =>
            d.verificationStatus === 'VERIFIED' ||
            d.approvalStatus === 'VERIFIED' ||
            d.approvalStatus === 'APPROVED'
        );
        setDoctors(verifiedOnly);
      }
      if (notifRes && Array.isArray(notifRes.data)) {
        setNotifications(notifRes.data);
      }
      if (rxRes && Array.isArray(rxRes.data)) {
        setPrescriptions(rxRes.data);
      }
    } catch (err) {
      console.error('Error fetching patient dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchDashboardData();

    const handleAptsUpdated = () => fetchDashboardData();
    const handleNotifsUpdated = () => {
      notificationService.getNotifications().then((res) => {
        if (res && Array.isArray(res.data)) setNotifications(res.data);
      });
    };

    window.addEventListener('quickcare_appointments_updated', handleAptsUpdated);
    window.addEventListener('quickcare_notifications_updated', handleNotifsUpdated);

    return () => {
      window.removeEventListener('quickcare_appointments_updated', handleAptsUpdated);
      window.removeEventListener('quickcare_notifications_updated', handleNotifsUpdated);
    };
  }, [user?.uid, user?.userId, user?.email]);

  // KPI Statistics (strictly derived from authenticated patient appointments)
  const total = appointments.length;
  const upcomingAppointments = useMemo(() => {
    return appointments.filter(
      (a) =>
        (a.status === 'CONFIRMED' || a.status === 'PENDING') &&
        !a.slotReleased
    );
  }, [appointments]);

  const upcoming = upcomingAppointments.length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelled = appointments.filter(
    (a) =>
      a.status === 'CANCELLED' ||
      a.status === 'REJECTED' ||
      a.status === 'DECLINED' ||
      a.slotReleased
  ).length;

  // Next Upcoming Appointment (earliest confirmed/pending visit)
  const nextAppointment = useMemo(() => {
    if (upcomingAppointments.length === 0) return null;
    const sorted = [...upcomingAppointments].sort((a, b) => {
      const dtA = `${a.appointmentDate || ''} ${a.appointmentTime || ''}`;
      const dtB = `${b.appointmentDate || ''} ${b.appointmentTime || ''}`;
      return dtA.localeCompare(dtB);
    });
    return sorted[0];
  }, [upcomingAppointments]);

  // Copy Meeting Link Handler
  const handleCopyMeetLink = (link, id) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedMeetId(id);
    setTimeout(() => setCopiedMeetId(null), 2000);
  };

  // Appointment Cancellation Handler
  const handleConfirmCancellation = async (e) => {
    e.preventDefault();
    if (!cancelTargetApt) return;
    setCancelling(true);
    const reasonText = customCancelNotes.trim() || cancelReason;
    try {
      await appointmentService.updateStatus(cancelTargetApt.appointmentId, 'CANCELLED', reasonText);
      setCancelTargetApt(null);
      setCustomCancelNotes('');
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    setProfileError('');

    try {
      const updatedData = {
        ...(user || {}),
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        age: profileForm.age,
        gender: profileForm.gender,
        address: profileForm.address,
        profileImage: profileForm.profileImage,
      };

      updateUser(updatedData);
      localStorage.setItem('quickcare_current_user', JSON.stringify(updatedData));

      // Sync registered users store
      try {
        const raw = localStorage.getItem('quickcare_all_registered_users');
        if (raw) {
          const list = JSON.parse(raw);
          const idx = list.findIndex(
            (u) => (u.email || '').toLowerCase().trim() === (profileForm.email || '').toLowerCase().trim()
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...updatedData };
            localStorage.setItem('quickcare_all_registered_users', JSON.stringify(list));
          }
        }
      } catch (err) {}

      // Push to backend
      try {
        await api.put('/patients/profile', profileForm);
      } catch (err) {}

      setProfileMsg('Personal profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture size must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileForm((prev) => ({ ...prev, profileImage: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    await notificationService.markAllAsRead();
    const res = await notificationService.getNotifications();
    if (res && Array.isArray(res.data)) setNotifications(res.data);
  };

  const handleMarkOneNotifRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
  };

  // Unread notification count
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      let matchesStatus = true;
      if (aptStatusFilter === 'UPCOMING') {
        matchesStatus = (a.status === 'CONFIRMED' || a.status === 'PENDING') && !a.slotReleased;
      } else if (aptStatusFilter === 'COMPLETED') {
        matchesStatus = a.status === 'COMPLETED';
      } else if (aptStatusFilter === 'CANCELLED') {
        matchesStatus = a.status === 'CANCELLED' || a.status === 'REJECTED' || a.status === 'DECLINED' || a.slotReleased;
      } else if (aptStatusFilter === 'PENDING') {
        matchesStatus = a.status === 'PENDING' && !a.slotReleased;
      }

      const q = aptSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.doctorName?.toLowerCase().includes(q) ||
        a.specialization?.toLowerCase().includes(q) ||
        a.appointmentId?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, aptStatusFilter, aptSearch]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSpec =
        docSpecialtyFilter === 'ALL' ||
        doc.specialization?.toLowerCase() === docSpecialtyFilter.toLowerCase();
      const q = docSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        doc.fullName?.toLowerCase().includes(q) ||
        doc.specialization?.toLowerCase().includes(q) ||
        doc.clinicAddress?.toLowerCase().includes(q) ||
        doc.qualification?.toLowerCase().includes(q);
      return matchesSpec && matchesQuery;
    });
  }, [doctors, docSpecialtyFilter, docSearchQuery]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'UNREAD') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, notifFilter]);

  // Unique Specializations
  const availableSpecializations = useMemo(() => {
    const set = new Set();
    doctors.forEach((d) => {
      if (d.specialization) set.add(d.specialization);
    });
    return ['ALL', ...Array.from(set)];
  }, [doctors]);

  // Video Consultations
  const videoAppointments = useMemo(() => {
    return appointments.filter((a) => a.consultationType === 'VIDEO');
  }, [appointments]);

  const upcomingVideoCount = useMemo(() => {
    return videoAppointments.filter(
      (a) => ['PENDING', 'CONFIRMED', 'APPROVED'].includes(a.status?.toUpperCase())
    ).length;
  }, [videoAppointments]);

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    if (!prescriptionSearch.trim()) return prescriptions;
    const q = prescriptionSearch.toLowerCase().trim();
    return prescriptions.filter(
      (p) =>
        p.doctorName?.toLowerCase().includes(q) ||
        p.diagnosis?.toLowerCase().includes(q) ||
        p.doctorSpecialization?.toLowerCase().includes(q) ||
        p.medicines?.some((m) => (m.name || m.medicineName || '').toLowerCase().includes(q))
    );
  }, [prescriptions, prescriptionSearch]);

  // Sidebar Navigation Items (Matching Doctor Portal Structure)
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'My Appointments', icon: Calendar, badge: upcoming > 0 ? upcoming : null },
    { id: 'doctors', label: 'Find Doctors', icon: Stethoscope, badge: doctors.length > 0 ? doctors.length : null },
    { id: 'video', label: 'Video Consultations', icon: Video, badge: upcomingVideoCount > 0 ? upcomingVideoCount : null, isMeet: true },
    { id: 'prescriptions', label: 'Digital Prescriptions', icon: FileText, badge: prescriptions.length > 0 ? prescriptions.length : null },
    { id: 'records', label: 'Medical Reports', icon: FolderOpen, badge: medicalRecords.length > 0 ? medicalRecords.length : null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : null, alert: unreadNotifsCount > 0 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            QC
          </div>
          <span className="font-extrabold text-sm text-slate-900 truncate max-w-[180px]">
            {profileForm.fullName || user?.fullName || 'Patient Portal'}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop: Sticky Left, Mobile: Slide-Out Drawer) */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 h-screen ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Patient Mini Profile */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900">QUICKCARE</span>
                <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Patient Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Patient Info Card */}
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/80 rounded-2xl flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base border-2 border-white shadow-xs overflow-hidden">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt="Patient" className="w-full h-full object-cover" />
                ) : (
                  (profileForm.fullName || user?.fullName || 'P').charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-xs text-slate-900 truncate">
                {profileForm.fullName || user?.fullName || 'Patient'}
              </p>
              <p className="text-[11px] font-medium text-blue-700 truncate">
                {profileForm.email || user?.email || 'patient@quickcare.com'}
              </p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 text-[10px] font-bold">
                Verified Patient
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white text-blue-800'
                        : item.alert
                        ? 'bg-rose-500 text-white animate-pulse'
                        : item.isMeet
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TOP BAR: LIVE CLOCK & DATE */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Kolkata',
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-400">Standard IST Timezone</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full font-mono text-[11px] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">IST:</span>
              <span className="font-bold text-emerald-300 tracking-wider">
                {istTime || 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* WELCOME HERO & PROFILE BANNER */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={
                  profileForm.profileImage ||
                  (profileForm.gender === 'Female'
                    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'
                    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120')
                }
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
              <button
                onClick={() => setActiveTab('profile')}
                className="absolute -bottom-1 -right-1 p-1 bg-white text-blue-700 rounded-full shadow-md hover:bg-blue-50 transition cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                  Patient Portal
                </span>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold">
                    <CheckCircle className="w-3 h-3 text-emerald-300" />
                    <span>Email Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold">
                    <ShieldAlert className="w-3 h-3 text-amber-300" />
                    <span>Pending Email Verification</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {total === 0
                  ? `Welcome, ${profileForm.fullName || 'Patient'}!`
                  : `Welcome back, ${profileForm.fullName || 'Patient'}!`}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100 font-medium pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 opacity-80" />
                  {profileForm.email || 'patient@example.com'}
                </span>
                {profileForm.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 opacity-80" />
                    {profileForm.phone}
                  </span>
                )}
                {profileForm.age && (
                  <span>
                    Age: <span className="font-bold">{profileForm.age} yrs</span>
                  </span>
                )}
                {profileForm.gender && (
                  <span>
                    Gender: <span className="font-bold">{profileForm.gender}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('doctors')}
              className="flex-1 sm:flex-none px-5 py-3 bg-white text-blue-800 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:bg-blue-50 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className="flex-1 sm:flex-none px-4 py-3 bg-blue-900/60 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Prescriptions</span>
            </button>
          </div>
        </div>

      {/* =========================================================================
          SECTION A: DASHBOARD OVERVIEW
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in">
          {/* 4 Statistics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Appointments
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{total}</p>
              <span className="text-[11px] text-slate-400 font-medium">All patient bookings</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Upcoming Consultations
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">{upcoming}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Confirmed & scheduled</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Completed Consultations
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-blue-700 mt-2">{completed}</p>
              <span className="text-[11px] text-blue-600 font-medium">Prescribed & fulfilled</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  Cancelled / Declined
                </span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-rose-700 mt-2">{cancelled}</p>
              <span className="text-[11px] text-rose-600 font-medium">Released & cancelled</span>
            </div>
          </div>

          {/* Next Upcoming Appointment Highlight */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-extrabold text-slate-900">Next Upcoming Appointment</h2>
              </div>
              {upcomingAppointments.length > 0 && (
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({upcomingAppointments.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs border border-slate-200/80">
                Loading upcoming appointment details...
              </div>
            ) : !nextAppointment ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">
                    No upcoming consultations scheduled
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You have zero upcoming appointments. Search our verified medical faculty and book your next consultation.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Book an Appointment</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-md space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        nextAppointment.doctorImage ||
                        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120'
                      }
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {nextAppointment.doctorName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {nextAppointment.specialization}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {nextAppointment.appointmentDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {nextAppointment.appointmentTime}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        nextAppointment.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {nextAppointment.status}
                    </span>
                    <button
                      onClick={() => setSelectedAptDetails(nextAppointment)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setCancelTargetApt(nextAppointment)}
                      className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Video Consultation Google Meet Box (Shown ONLY when approved and provided by doctor) */}
                {nextAppointment.consultationType === 'VIDEO' ? (
                  Boolean(
                    nextAppointment.videoConsultationLink || nextAppointment.googleMeetLink
                  ) &&
                  Boolean(
                    nextAppointment.videoLinkSent || nextAppointment.status === 'CONFIRMED'
                  ) ? (
                    <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
                            Doctor Provided Google Meet Video Link
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Your doctor has approved and scheduled your live telemedicine session.
                        </p>
                        {nextAppointment.doctorNotes && (
                          <p className="text-[11px] text-teal-800 italic">
                            Doctor's Note: {nextAppointment.doctorNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyMeetLink(
                              nextAppointment.videoConsultationLink ||
                                nextAppointment.googleMeetLink,
                              nextAppointment.appointmentId
                            )
                          }
                          className="px-3 py-2 bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Copy Google Meet Link"
                        >
                          {copiedMeetId === nextAppointment.appointmentId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={
                            nextAppointment.videoConsultationLink ||
                            nextAppointment.googleMeetLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Google Meet</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Video consultation confirmed. Your doctor will provide the Google Meet link before consultation time.
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-bold text-[10px] shrink-0">
                        Awaiting Link
                      </span>
                    </div>
                  )
                ) : (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs text-blue-900">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      In-Person Visit: <span className="font-bold">{nextAppointment.clinicAddress || 'QuickCare Health Center'}</span>. Please arrive 10 minutes before your slot.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Find Doctors Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Verified Medical Specialists</h2>
                <p className="text-xs text-slate-500">
                  Book appointments with verified practitioners across specialties.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Doctors ({doctors.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {doctors.slice(0, 3).map((doc) => (
                <DoctorCard key={doc.doctorId || doc.uid} doctor={doc} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION B: MY APPOINTMENTS TAB
      ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">My Appointments</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your scheduled clinical consultations, join video calls, or review completed records.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('doctors')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Book New Appointment</span>
            </button>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              {[
                { id: 'ALL', label: 'All', count: appointments.length },
                { id: 'UPCOMING', label: 'Upcoming', count: upcoming },
                { id: 'PENDING', label: 'Pending', count: appointments.filter((a) => a.status === 'PENDING').length },
                { id: 'COMPLETED', label: 'Completed', count: completed },
                { id: 'CANCELLED', label: 'Cancelled', count: cancelled },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAptStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    aptStatusFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      aptStatusFilter === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                placeholder="Search appointments..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200/80">
              Loading your appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {appointments.length === 0
                    ? 'No appointments yet'
                    : 'No appointments match the filter'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {appointments.length === 0
                    ? 'You have not booked any appointments yet. Select a doctor to schedule your first consultation.'
                    : 'Try changing your status filter or search query.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Find Doctors</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => {
                const isVideo = apt.consultationType === 'VIDEO';
                const hasMeetLink = Boolean(
                  (apt.videoConsultationLink || apt.googleMeetLink) &&
                    (apt.videoLinkSent || apt.status === 'CONFIRMED')
                );
                const meetUrl = apt.videoConsultationLink || apt.googleMeetLink;
                const canCancel =
                  (apt.status === 'CONFIRMED' || apt.status === 'PENDING') &&
                  !apt.slotReleased;

                return (
                  <div
                    key={apt.appointmentId}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              apt.doctorImage ||
                              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'
                            }
                            alt=""
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {apt.doctorName}
                            </h4>
                            <p className="text-xs text-blue-600 font-semibold">
                              {apt.specialization}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              ID: <span className="font-mono">{apt.appointmentId}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : apt.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            Date & Time:
                          </span>
                          <span className="font-bold text-slate-800">
                            {apt.appointmentDate} at {apt.appointmentTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            {isVideo ? (
                              <Video className="w-3.5 h-3.5 text-teal-600" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            Consultation Mode:
                          </span>
                          <span className="font-semibold text-slate-700">
                            {isVideo ? 'Telehealth (Video)' : 'In-Person (Clinic)'}
                          </span>
                        </div>

                        {apt.reason && (
                          <div className="pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-400">Reason: </span>
                            <span className="text-slate-700">{apt.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Video Consultation Link Banner if approved */}
                      {isVideo && hasMeetLink && (
                        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-xs font-bold text-teal-900 truncate">
                              Google Meet Available
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyMeetLink(meetUrl, apt.appointmentId)}
                              className="p-1.5 bg-white text-teal-700 border border-teal-200 rounded-lg text-[11px] font-bold hover:bg-teal-50"
                              title="Copy Google Meet Link"
                            >
                              {copiedMeetId === apt.appointmentId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meet</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedAptDetails(apt)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Details
                      </button>

                      <div className="flex items-center gap-2">
                        {apt.prescriptionId && (
                          <button
                            onClick={() => setSelectedPrescription(apt.prescription)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Prescription</span>
                          </button>
                        )}

                        {canCancel && (
                          <button
                            onClick={() => setCancelTargetApt(apt)}
                            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION C: FIND DOCTORS TAB
      ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
              Verified Medical Faculty
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Find & Book Verified Doctors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All doctors listed below have verified medical board qualifications and credentials.
            </p>
          </div>

          {/* Search & Specialty Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Search doctors by name, specialty, clinic, or qualification..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Specialty Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {availableSpecializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setDocSpecialtyFilter(spec)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                    docSpecialtyFilter === spec
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Grid */}
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-xs text-slate-400">
              No doctors found matching the search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doc) => (
                <DoctorCard key={doc.doctorId || doc.uid} doctor={doc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION D: VIDEO CONSULTATIONS (GOOGLE MEET EXCLUSIVE)
      ========================================================================= */}
      {activeTab === 'video' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md flex items-center gap-1.5 w-fit">
                <Video className="w-3.5 h-3.5 text-emerald-300" />
                Google Meet Telehealth Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Live Video Consultations
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
                QuickCare exclusively uses Google Meet for high-definition, encrypted medical video consultations. Your doctor will review and send your personalized Google Meet link.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('doctors')}
              className="px-5 py-3 bg-white text-teal-800 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:bg-teal-50 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Book Video Consultation</span>
            </button>
          </div>

          {/* Telemedicine Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">1. Doctor Approval</p>
                <p className="text-slate-500 text-[11px]">Doctor reviews and creates your Google Meet room</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">2. Instant Notification</p>
                <p className="text-slate-500 text-[11px]">Link sent via email & shown on your dashboard</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">3. 1-Click Join</p>
                <p className="text-slate-500 text-[11px]">Join directly from browser or Google Meet app</p>
              </div>
            </div>
          </div>

          {/* Video Consultations List */}
          {videoAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">No Video Consultations Scheduled</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When you schedule a consultation with "Video Consultation" selected, your doctor's Google Meet invitation will appear here.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                Find Doctors & Book Call
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {videoAppointments.map((apt) => {
                const meetLink = apt.googleMeetLink || apt.videoConsultationLink;
                const isCompleted = (apt.status || '').toUpperCase() === 'COMPLETED';
                const isCancelled = (apt.status || '').toUpperCase() === 'CANCELLED';

                return (
                  <div
                    key={apt.appointmentId}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-200 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base shrink-0">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-sm">{apt.doctorName}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                              {apt.specialization || 'Specialist'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{apt.appointmentDate} at {apt.appointmentTime}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            isCompleted
                              ? 'bg-blue-100 text-blue-800'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : meetLink
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCompleted
                            ? 'Consultation Completed'
                            : isCancelled
                            ? 'Cancelled'
                            : meetLink
                            ? 'Google Meet Ready'
                            : 'Awaiting Doctor Link'}
                        </span>
                      </div>
                    </div>

                    {/* Google Meet Link Display & Actions */}
                    {meetLink && !isCompleted && !isCancelled && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                            <Video className="w-4 h-4 text-emerald-600" />
                            <span>Google Meet Invitation Ready</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-mono truncate max-w-md">
                            {meetLink}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(meetLink);
                              setCopiedMeetId(apt.appointmentId);
                              setTimeout(() => setCopiedMeetId(null), 2500);
                            }}
                            className="px-3 py-2 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedMeetId === apt.appointmentId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Google Meet</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {!meetLink && !isCompleted && !isCancelled && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          The doctor has received your appointment request. As soon as the doctor approves and sets up the Google Meet session, the join link will appear here and will be emailed to your inbox.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION E: DIGITAL PRESCRIPTIONS TAB
      ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Digital Prescriptions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified digital medical prescriptions, doctor clinical instructions, and prescribed dosages.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prescriptionSearch}
                onChange={(e) => setPrescriptionSearch(e.target.value)}
                placeholder="Search doctor, diagnosis, medicines..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No Digital Prescriptions Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                After a completed clinical or Google Meet consultation, your doctor's official digital prescription will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrescriptions.map((rx) => (
                <div
                  key={rx.prescriptionId || rx.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {rx.doctorName || 'Doctor'}
                        </h4>
                        <p className="text-xs text-blue-600 font-semibold">
                          {rx.doctorSpecialization || 'Clinical Specialist'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Diagnosis:</span>
                      <span className="font-bold text-slate-800">{rx.diagnosis || 'General Checkup'}</span>
                    </div>
                    {rx.medicines && rx.medicines.length > 0 && (
                      <div className="pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 block mb-1">Prescribed Medicines ({rx.medicines.length}):</span>
                        <div className="flex flex-wrap gap-1">
                          {rx.medicines.slice(0, 3).map((m, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700"
                            >
                              💊 {m.name || m.medicineName} ({m.dosage || 'Standard'})
                            </span>
                          ))}
                          {rx.medicines.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{rx.medicines.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPrescription(rx)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Official Prescription</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION E2: MEDICAL REPORTS & LAB RECORDS TAB
      ========================================================================= */}
      {activeTab === 'records' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Medical Reports & Diagnostic Records</h1>
              <p className="text-xs text-slate-500 mt-1">
                Upload your blood test results, radiology scans, pathology reports, and past prescriptions for doctor consultations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRecordError('');
                setRecordModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload Medical Report</span>
            </button>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['ALL', 'Lab Report', 'Imaging / X-Ray', 'Pathology', 'Prescription', 'Discharge Summary'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setRecordFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  recordFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Reports' : cat}
              </button>
            ))}
          </div>

          {/* Records List / Grid */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                <FolderOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-extrabold text-slate-900">No medical records uploaded yet!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload your previous lab reports, X-rays, and prescriptions so consulting doctors can review your complete clinical background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                <span>Upload First Medical Document</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((rec) => (
                <div
                  key={rec.recordId}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {rec.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {rec.date}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate" title={rec.title}>
                          {rec.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {rec.fileName} ({rec.fileSize || 'Document'})
                        </p>
                      </div>
                    </div>

                    {rec.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl line-clamp-2">
                        {rec.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedViewingRecord(rec)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <a
                        href={rec.fileData}
                        download={rec.fileName || 'medical_report'}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(rec.recordId)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION F: MY PROFILE TAB
      ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Personal Health Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and update your personal health record, contact information, and avatar.
            </p>
          </div>

          {profileMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
              <div className="relative group">
                <img
                  src={
                    profileForm.profileImage ||
                    (profileForm.gender === 'Female'
                      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=140'
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140')
                  }
                  alt=""
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-200 shadow-md"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition cursor-pointer"
                  title="Upload New Photo"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-extrabold text-slate-900">{profileForm.fullName}</h3>
                <p className="text-xs text-slate-500">{profileForm.email}</p>
                <div className="pt-1">
                  {user?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Email Verified via OTP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Verified)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={profileForm.age}
                      onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                      placeholder="e.g. 28"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Address
                </label>
                <textarea
                  rows="2"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Street, City, Postal Code"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION E: NOTIFICATIONS TAB
      ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time appointment alerts, doctor confirmations, and Google Meet video consultation invitations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  onClick={() => setNotifFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    notifFilter === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('UNREAD')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    notifFilter === 'UNREAD' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Unread ({unreadNotifsCount})
                </button>
              </div>

              {unreadNotifsCount > 0 && (
                <button
                  onClick={handleMarkAllNotifsRead}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No notifications</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You're all caught up! You'll receive alerts for appointment confirmations, doctor approvals, and video links here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const isVideoNotif =
                  notif.type?.includes('VIDEO') ||
                  notif.message?.includes('meet.google.com') ||
                  notif.googleMeetLink;
                const meetUrl =
                  notif.googleMeetLink ||
                  (notif.message?.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i) || [])[0];

                return (
                  <div
                    key={notif.notificationId}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      notif.isRead
                        ? 'bg-white border-slate-200/80 shadow-xs'
                        : 'bg-blue-50/50 border-blue-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isVideoNotif
                            ? 'bg-teal-100 text-teal-700'
                            : notif.type?.includes('CANCEL')
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isVideoNotif ? (
                          <Video className="w-4 h-4" />
                        ) : notif.type?.includes('CANCEL') ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-xs">
                            {notif.title || 'Notification'}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleString('en-US', {
                                timeZone: 'Asia/Kolkata',
                              })
                            : ''}
                        </span>

                        {/* Direct Video Join Button if present */}
                        {meetUrl && (
                          <div className="pt-2 flex items-center gap-2">
                            <a
                              href={meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Google Meet Call</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkOneNotifRead(notif.notificationId)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          APPOINTMENT DETAILS MODAL
      ========================================================================= */}
      {selectedAptDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Appointment Overview
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Consultation with {selectedAptDetails.doctorName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Specialization:</span>
                <span className="font-bold text-slate-800">{selectedAptDetails.specialization}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-800">
                  {selectedAptDetails.appointmentDate} at {selectedAptDetails.appointmentTime}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Status:</span>
                <span className="font-extrabold uppercase text-blue-700">
                  {selectedAptDetails.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Consultation Mode:</span>
                <span className="font-bold text-slate-800">
                  {selectedAptDetails.consultationType === 'VIDEO' ? 'Telehealth (Video)' : 'In-Person (Clinic)'}
                </span>
              </div>
              {selectedAptDetails.clinicAddress && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Clinic Location:</span>
                  <span className="font-bold text-slate-800">{selectedAptDetails.clinicAddress}</span>
                </div>
              )}
              {selectedAptDetails.reason && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Consultation Notes / Symptoms:</span>
                  <span className="font-medium text-slate-800">{selectedAptDetails.reason}</span>
                </div>
              )}
              {selectedAptDetails.doctorNotes && (
                <div className="py-1 pt-2 border-t border-slate-200/60">
                  <span className="text-teal-700 font-bold block mb-0.5">Doctor Instructions:</span>
                  <span className="font-medium text-slate-700">{selectedAptDetails.doctorNotes}</span>
                </div>
              )}
            </div>

            {/* Video Link in Details */}
            {selectedAptDetails.consultationType === 'VIDEO' &&
              (selectedAptDetails.videoConsultationLink || selectedAptDetails.googleMeetLink) && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-900 truncate">
                    Google Meet Live Video Link
                  </span>
                  <a
                    href={selectedAptDetails.videoConsultationLink || selectedAptDetails.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Call</span>
                  </a>
                </div>
              )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CANCELLATION CONFIRMATION MODAL
      ========================================================================= */}
      {cancelTargetApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-extrabold text-slate-900">Cancel Appointment</h3>
              </div>
              <button
                onClick={() => setCancelTargetApt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your consultation with{' '}
              <span className="font-bold text-slate-900">{cancelTargetApt.doctorName}</span> on{' '}
              <span className="font-bold text-slate-900">{cancelTargetApt.appointmentDate} at {cancelTargetApt.appointmentTime}</span>?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
              <span className="font-bold">Cancellation Rule Notice: </span>
              Cancelling releases your reserved time slot back to the clinical schedule so other patients may book.
            </div>

            <form onSubmit={handleConfirmCancellation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation:
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Personal schedule conflict">Personal schedule conflict</option>
                  <option value="Emergency or unforeseen event">Emergency or unforeseen event</option>
                  <option value="Symptoms improved / no longer need consultation">Symptoms improved / no longer need consultation</option>
                  <option value="Want to reschedule to a later date">Want to reschedule to a later date</option>
                  <option value="Booked by error">Booked by error</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes (Optional):
                </label>
                <textarea
                  rows="2"
                  value={customCancelNotes}
                  onChange={(e) => setCustomCancelNotes(e.target.value)}
                  placeholder="Provide any feedback for the doctor..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelTargetApt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}

      {/* Upload Medical Record Modal */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Upload Medical Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recordError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) or Spine X-Ray"
                  value={recordForm.title}
                  onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category *</label>
                  <select
                    value={recordForm.category}
                    onChange={(e) => setRecordForm({ ...recordForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Lab Report">Lab Report (Blood / Urine)</option>
                    <option value="Imaging / X-Ray">Imaging / X-Ray / MRI</option>
                    <option value="Pathology">Pathology / Biopsy</option>
                    <option value="Prescription">Past Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Other">Other Clinical Document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Report Date *</label>
                  <input
                    type="date"
                    required
                    value={recordForm.date}
                    onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* File Picker */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Attach Document (PDF, PNG, JPG - max 8MB) *</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center bg-slate-50/70 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    onChange={handleRecordFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                    <p className="font-bold text-slate-700 text-xs">
                      {recordForm.fileName ? recordForm.fileName : 'Click or drag file to upload'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {recordForm.fileSize ? `Size: ${recordForm.fileSize}` : 'Supports diagnostic PDF reports & scans'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Doctor Notes / Observation (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Test ordered by previous doctor, elevated white blood cell count..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Save & Secure in Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Preview Modal */}
      {selectedViewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  {selectedViewingRecord.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedViewingRecord.title}</h3>
                <p className="text-xs text-slate-500">Report Date: {selectedViewingRecord.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedViewingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto flex items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {selectedViewingRecord.fileData?.startsWith('data:image') ? (
                <img
                  src={selectedViewingRecord.fileData}
                  alt={selectedViewingRecord.title}
                  className="max-h-[50vh] object-contain rounded-xl"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-blue-600 mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">{selectedViewingRecord.fileName}</p>
                  <p className="text-xs text-slate-500">Document ({selectedViewingRecord.fileSize})</p>
                  <a
                    href={selectedViewingRecord.fileData}
                    download={selectedViewingRecord.fileName}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
                  >
                    <Download className="w-4 h-4" /> Download Document
                  </a>
                </div>
              )}
            </div>

            {selectedViewingRecord.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                <span className="font-bold block text-slate-800 mb-0.5">Notes:</span>
                {selectedViewingRecord.notes}
              </div>
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
};
