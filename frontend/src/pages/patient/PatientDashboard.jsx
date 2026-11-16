import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { notificationService } from '../../services/notificationService';
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
} from 'lucide-react';

export const PatientDashboard = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab from query param (?tab=overview|appointments|doctors|profile|notifications)
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // State
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
      const [aptRes, docRes, notifRes] = await Promise.all([
        appointmentService.getPatientAppointments().catch(() => ({ data: [] })),
        doctorService.searchDoctors().catch(() => ({ data: [] })),
        notificationService.getNotifications().catch(() => ({ data: [] })),
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
    } catch (err) {
      console.error('Error fetching patient dashboard data', err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      {/* =========================================================================
          TOP BAR: LIVE CLOCK & DATE
      ========================================================================= */}
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

      {/* =========================================================================
          WELCOME HERO & PROFILE BANNER
      ========================================================================= */}
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
          <Link
            to="/patient/prescriptions"
            className="flex-1 sm:flex-none px-4 py-3 bg-blue-900/60 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Prescriptions</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          DASHBOARD NAVIGATION TABS (5 Core Sections)
      ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'appointments', label: 'My Appointments', icon: Calendar, badge: upcoming > 0 ? upcoming : null },
          { id: 'doctors', label: 'Find Doctors', icon: Stethoscope, badge: doctors.length > 0 ? doctors.length : null },
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : null, alert: unreadNotifsCount > 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-t-2xl font-bold transition flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/70'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    tab.alert
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
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
          SECTION D: MY PROFILE TAB
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
    </div>
  );
};
