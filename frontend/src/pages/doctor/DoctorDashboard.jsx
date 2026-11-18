import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { AppointmentCard } from '../../components/common/AppointmentCard';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Video,
  Sliders,
  Bell,
  User,
  LogOut,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  FilePlus,
  Plus,
  Clock4,
  Mail,
  Phone,
  Building,
  Award,
  ChevronRight,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from URL query (?tab=overview|appointments|schedule|patients|video|availability|notifications|profile)
  const currentTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send Google Meet Link Modal
  const [selectedVideoApt, setSelectedVideoApt] = useState(null);
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [submittingMeetLink, setSubmittingMeetLink] = useState(false);
  const [meetModalSuccess, setMeetModalSuccess] = useState('');
  const [meetModalError, setMeetModalError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Reject Modal
  const [rejectApt, setRejectApt] = useState(null);
  const [rejectReason, setRejectReason] = useState('Doctor is unavailable at requested time.');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Patient Medical History Modal
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);

  // Filter & Search states for Appointments Tab
  const [aptStatusFilter, setAptStatusFilter] = useState('ALL');
  const [aptTypeFilter, setAptTypeFilter] = useState('ALL');
  const [aptSearchQuery, setAptSearchQuery] = useState('');

  // Video Tab Filter
  const [videoFilter, setVideoFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'SENT' | 'COMPLETED'
  const [videoSearch, setVideoSearch] = useState('');

  // Patients Tab Search
  const [patientSearch, setPatientSearch] = useState('');

  // Availability Tab State
  const [availableDays, setAvailableDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [workingStartTime, setWorkingStartTime] = useState('09:00 AM');
  const [workingEndTime, setWorkingEndTime] = useState('05:00 PM');
  const [breakStartTime, setBreakStartTime] = useState('01:00 PM');
  const [breakEndTime, setBreakEndTime] = useState('02:00 PM');
  const [slotDuration, setSlotDuration] = useState(15);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilitySuccess, setAvailabilitySuccess] = useState('');

  // Profile Tab State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    specialization: 'General Physician',
    qualification: 'MBBS, MD',
    experience: 5,
    consultationFee: 600,
    clinicAddress: '',
    medicalRegistrationNumber: '',
    bio: '',
    profileImage: '',
    gender: 'Male',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Online status toggle
  const [onlineStatus, setOnlineStatus] = useState('AVAILABLE_FOR_VIDEO');

  // --- Fetch Doctor Profile and Doctor-Specific Appointments ---
  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const docRes = await doctorService.getMyDoctorProfile();
      const currentDoc = docRes?.data || null;

      // Identify clean name
      const authRawName = user?.fullName || 'Doctor';
      const cleanAuthName = authRawName.replace(/^(?:dr\.?\s*)+/i, '').trim();

      const resolvedDoc = currentDoc || {
        doctorId: user?.doctorId || user?.userId || user?.uid || 'doc_current',
        uid: user?.userId || user?.uid,
        fullName: `Dr. ${cleanAuthName}`,
        specialization: user?.specialization || 'General Physician',
        qualification: user?.qualification || 'MBBS, MD',
        consultationFee: user?.consultationFee || 600,
        experience: user?.experience || 5,
        clinicAddress: user?.clinicAddress || user?.address || 'QuickCare Telehealth Center',
        medicalRegistrationNumber: user?.medicalRegistrationNumber || 'REG-101',
        bio: user?.bio || 'Dedicated medical consultant at QuickCare Healthcare.',
        gender: user?.gender || 'Male',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingStartTime: '09:00 AM',
        workingEndTime: '05:00 PM',
        slotDurationMinutes: 15,
        onlineStatus: 'AVAILABLE_FOR_VIDEO',
      };

      setDoctor(resolvedDoc);
      setOnlineStatus(resolvedDoc.onlineStatus || 'AVAILABLE_FOR_VIDEO');

      // Populate availability
      if (resolvedDoc.availableDays && resolvedDoc.availableDays.length > 0) {
        setAvailableDays(resolvedDoc.availableDays);
      }
      if (resolvedDoc.workingStartTime) setWorkingStartTime(resolvedDoc.workingStartTime);
      if (resolvedDoc.workingEndTime) setWorkingEndTime(resolvedDoc.workingEndTime);
      if (resolvedDoc.breakStartTime) setBreakStartTime(resolvedDoc.breakStartTime);
      if (resolvedDoc.breakEndTime) setBreakEndTime(resolvedDoc.breakEndTime);
      if (resolvedDoc.slotDurationMinutes) setSlotDuration(resolvedDoc.slotDurationMinutes);

      // Populate profile form
      setProfileForm({
        fullName: (resolvedDoc.fullName || '').replace(/^(?:dr\.?\s*)+/i, '').trim(),
        specialization: resolvedDoc.specialization || 'General Physician',
        qualification: resolvedDoc.qualification || 'MBBS, MD',
        experience: resolvedDoc.experience || 5,
        consultationFee: resolvedDoc.consultationFee || 600,
        clinicAddress: resolvedDoc.clinicAddress || '',
        medicalRegistrationNumber: resolvedDoc.medicalRegistrationNumber || '',
        bio: resolvedDoc.bio || '',
        profileImage: resolvedDoc.profileImage || '',
        gender: resolvedDoc.gender || 'Male',
      });

      // Fetch appointments strictly for this doctor
      const [aptRes, rxRes] = await Promise.all([
        appointmentService.getDoctorAppointments(resolvedDoc.doctorId),
        prescriptionService.getDoctorPrescriptions().catch(() => ({ data: [] })),
      ]);

      if (aptRes && aptRes.data) {
        setAppointments(aptRes.data);
      }
      if (rxRes && rxRes.data) {
        setPrescriptions(rxRes.data);
      }

      // Read local notifications for this doctor
      try {
        const rawNotifs = localStorage.getItem('quickcare_notifications');
        if (rawNotifs) {
          const allN = JSON.parse(rawNotifs);
          const docN = allN.filter(
            (n) =>
              n.recipientUid === resolvedDoc.uid ||
              n.recipientUid === resolvedDoc.doctorId ||
              n.recipientEmail === resolvedDoc.email ||
              n.type?.startsWith('DOCTOR') ||
              n.type === 'APPOINTMENT_BOOKED'
          );
          setNotifications(docN);
        }
      } catch (e) {}
    } catch (err) {
      console.warn('Doctor clinical portal fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user?.userId, user?.uid, user?.email]);

  // Dynamic Statistics computed from real records for THIS doctor
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const stats = useMemo(() => {
    const total = appointments.length;
    const todayCount = appointments.filter((a) => a.appointmentDate === todayStr).length;
    const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
    const videoCount = appointments.filter((a) => a.consultationType === 'VIDEO').length;
    const pendingVideoLinks = appointments.filter(
      (a) => a.consultationType === 'VIDEO' && a.status !== 'CANCELLED' && a.status !== 'REJECTED' && !a.videoLinkSent
    ).length;

    return {
      total,
      todayCount,
      pendingCount,
      completedCount,
      videoCount,
      pendingVideoLinks,
    };
  }, [appointments, todayStr]);

  // Next Scheduled Patient (first upcoming confirmed/pending appointment)
  const nextScheduledPatient = useMemo(() => {
    const active = appointments.filter(
      (a) =>
        (a.status === 'CONFIRMED' || a.status === 'PENDING') &&
        !a.slotReleased &&
        a.appointmentDate >= todayStr
    );
    if (active.length === 0) return null;
    active.sort((a, b) => {
      const dateA = `${a.appointmentDate} ${a.appointmentTime}`;
      const dateB = `${b.appointmentDate} ${b.appointmentTime}`;
      return dateA.localeCompare(dateB);
    });
    return active[0];
  }, [appointments, todayStr]);

  // Today's Appointments sorted chronologically
  const todayAppointments = useMemo(() => {
    const list = appointments.filter((a) => a.appointmentDate === todayStr);
    list.sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
    return list;
  }, [appointments, todayStr]);

  // Unique Patients Roster for this Doctor
  const patientRoster = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      const key = a.patientUid || a.patientId || (a.patientEmail || '').toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          patientId: a.patientId,
          patientUid: a.patientUid,
          patientName: a.patientName || 'Patient',
          patientEmail: a.patientEmail || '',
          patientPhone: a.patientPhone || 'Not specified',
          totalVisits: 1,
          lastVisitDate: a.appointmentDate,
          lastVisitTime: a.appointmentTime,
          latestReason: a.reason || 'General Consultation',
          appointments: [a],
        });
      } else {
        const item = map.get(key);
        item.totalVisits += 1;
        item.appointments.push(a);
        if (a.appointmentDate > item.lastVisitDate) {
          item.lastVisitDate = a.appointmentDate;
          item.lastVisitTime = a.appointmentTime;
          item.latestReason = a.reason || item.latestReason;
        }
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  // Handle Status Changes (Approve, Complete, Cancel)
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentService.updateStatus(appointmentId, newStatus);
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed.');
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectApt) return;
    try {
      setSubmittingReject(true);
      await appointmentService.rejectAppointment(rejectApt.appointmentId, { reason: rejectReason });
      setRejectApt(null);
      fetchDoctorData();
    } catch (err) {
      alert('Failed to decline appointment: ' + err.message);
    } finally {
      setSubmittingReject(false);
    }
  };

  // Open Google Meet Modal
  const handleOpenMeetModal = (apt) => {
    setSelectedVideoApt(apt);
    setMeetLinkInput(apt.googleMeetLink || apt.videoConsultationLink || '');
    setMeetModalError('');
    setMeetModalSuccess('');
  };

  // Send Google Meet Invitation
  const handleSendGoogleMeetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVideoApt) return;

    const trimmed = (meetLinkInput || '').trim();
    if (!trimmed || !trimmed.toLowerCase().includes('meet.google.com')) {
      setMeetModalError('Please enter a valid Google Meet URL containing meet.google.com (e.g. https://meet.google.com/xxx-yyyy-zzz)');
      return;
    }

    try {
      setSubmittingMeetLink(true);
      setMeetModalError('');
      const res = await appointmentService.sendVideoConsultationLink(
        selectedVideoApt.appointmentId,
        trimmed
      );
      setMeetModalSuccess(
        res?.message || `Google Meet invitation sent to ${selectedVideoApt.patientEmail || 'patient'} successfully!`
      );
      setTimeout(() => {
        setSelectedVideoApt(null);
        setMeetModalSuccess('');
        fetchDoctorData();
      }, 1500);
    } catch (err) {
      setMeetModalError(err.message || 'Failed to dispatch Google Meet invitation.');
    } finally {
      setSubmittingMeetLink(false);
    }
  };

  // Auto-generate Google Meet URL
  const handleAutoGenerateMeetLink = () => {
    const cleanApt = (selectedVideoApt?.appointmentId || 'live').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    setMeetLinkInput(`https://meet.google.com/qck-${cleanApt}`);
    setMeetModalError('');
  };

  // Copy Link helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Save Availability Settings
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setSavingAvailability(true);
    setAvailabilitySuccess('');
    try {
      const cleanWorkingHours = `${workingStartTime} - ${workingEndTime}`;
      const updatePayload = {
        ...doctor,
        doctorId: doctor?.doctorId,
        uid: doctor?.uid || user?.userId || user?.uid,
        email: doctor?.email || user?.email,
        availableDays,
        workingStartTime,
        workingEndTime,
        breakStartTime,
        breakEndTime,
        slotDurationMinutes: Number(slotDuration),
        workingHours: cleanWorkingHours,
      };
      await doctorService.updateDoctorProfile(updatePayload);
      await doctorService.updateAvailability(updatePayload).catch(() => {});
      if (updateUser) {
        updateUser({ ...updatePayload });
      }
      setAvailabilitySuccess(
        `Availability schedule saved! Patients can now book appointment slots up to ${workingEndTime}.`
      );
      setTimeout(() => setAvailabilitySuccess(''), 5000);
      fetchDoctorData();
    } catch (err) {
      alert('Failed to save availability: ' + err.message);
    } finally {
      setSavingAvailability(false);
    }
  };

  // Save Doctor Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const cleanName = profileForm.fullName.replace(/^(?:dr\.?\s*)+/i, '').trim();
      const updatedPayload = {
        ...doctor,
        fullName: `Dr. ${cleanName}`,
        specialization: profileForm.specialization,
        qualification: profileForm.qualification,
        experience: Number(profileForm.experience),
        consultationFee: Number(profileForm.consultationFee),
        clinicAddress: profileForm.clinicAddress,
        medicalRegistrationNumber: profileForm.medicalRegistrationNumber,
        bio: profileForm.bio,
        profileImage: profileForm.profileImage,
        gender: profileForm.gender,
      };
      await doctorService.updateDoctorProfile(updatedPayload);
      updateUser({
        fullName: `Dr. ${cleanName}`,
        specialization: profileForm.specialization,
        qualification: profileForm.qualification,
        consultationFee: Number(profileForm.consultationFee),
      });
      setProfileSuccess('Doctor clinical profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
      fetchDoctorData();
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cleanDoctorDisplay = (doctor?.fullName || user?.fullName || 'Doctor')
    .replace(/^(?:dr\.?\s*)+/i, '')
    .trim();

  // Navigation Items for Sidebar (All 9 Requirements)
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: stats.pendingCount },
    { id: 'schedule', label: "Today's Schedule", icon: Clock, badge: stats.todayCount },
    { id: 'patients', label: 'Patients', icon: Users, badge: patientRoster.length },
    { id: 'video', label: 'Video Consultations', icon: Video, badge: stats.pendingVideoLinks, isMeet: true },
    { id: 'availability', label: 'My Availability', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm">
            QC
          </div>
          <span className="font-extrabold text-sm text-slate-900">Dr. {cleanDoctorDisplay}</span>
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
        {/* Brand & Doctor Mini Profile */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900">QUICKCARE</span>
                <span className="block text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                  Clinical Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Doctor Info Card */}
          <div className="p-3 bg-gradient-to-br from-teal-50 to-blue-50/50 border border-teal-100/80 rounded-2xl flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  doctor?.profileImage ||
                  (doctor?.gender === 'Female'
                    ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
                    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400')
                }
                alt={doctor?.fullName}
                className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-xs text-slate-900 truncate">Dr. {cleanDoctorDisplay}</p>
              <p className="text-[11px] font-medium text-teal-700 truncate">
                {doctor?.specialization || 'General Physician'}
              </p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-teal-100/70 text-teal-800 text-[10px] font-bold">
                {doctor?.verificationStatus === 'VERIFIED' ? 'Verified Doctor' : 'Review Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List (9 Structured Items) */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white text-teal-800'
                        : item.isMeet
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout (Item 9) */}
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
        {/* Verification Warning if doctor is pending */}
        {doctor?.verificationStatus === 'PENDING' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">Medical Council Verification In Progress</p>
                <p className="text-[11px] text-amber-800">
                  Your credentials ({doctor?.medicalRegistrationNumber}) are being reviewed by the medical board. You will be able to receive public bookings once verified.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded-full text-[10px] shrink-0">
              Pending Review
            </span>
          </div>
        )}

        {/* Verification Warning if doctor was rejected */}
        {doctor?.verificationStatus === 'REJECTED' && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-extrabold text-xs">Medical Registration Application Declined</p>
                <p className="text-[11px] text-rose-800">
                  Reason: {doctor?.rejectionReason || 'Uploaded qualification credentials could not be verified by the medical board.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs cursor-pointer"
            >
              Update Documents & Re-submit
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: DASHBOARD OVERVIEW
        ========================================================================= */}
        {currentTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Clinical Header Banner */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-extrabold backdrop-blur-md">
                    Clinical Practice Portal
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Google Meet Enabled
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, Dr. {cleanDoctorDisplay}
                </h1>
                <p className="text-teal-100 text-xs sm:text-sm font-medium">
                  {doctor?.specialization || 'General Physician'} • {doctor?.qualification || 'MBBS, MD'} • Consultation Fee: ₹{doctor?.consultationFee || 600}
                </p>
                <p className="text-teal-200/80 text-[11px]">
                  Clinic: {doctor?.clinicAddress || 'QuickCare Telehealth Center'}
                </p>
              </div>

              {/* Quick Actions Header */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to="/doctor/prescriptions/new"
                  className="px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <FilePlus className="w-4 h-4 text-teal-600" />
                  <span>Write Prescription</span>
                </Link>
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>New Google Meet Room</span>
                </a>
              </div>
            </div>

            {/* 5 DYNAMIC METRIC CARDS (Requirement 2) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Total Appointments */}
              <div
                onClick={() => setActiveTab('appointments')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Visits
                  </span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                <span className="text-[10px] text-slate-400 block">All-time consultations</span>
              </div>

              {/* Card 2: Today's Appointments */}
              <div
                onClick={() => setActiveTab('schedule')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Today's Visits
                  </span>
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-2xl font-black text-teal-700">{stats.todayCount}</p>
                <span className="text-[10px] text-slate-400 block">Scheduled for today</span>
              </div>

              {/* Card 3: Pending Requests */}
              <div
                onClick={() => {
                  setAptStatusFilter('PENDING');
                  setActiveTab('appointments');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                    Pending Requests
                  </span>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-amber-600">{stats.pendingCount}</p>
                <span className="text-[10px] text-slate-400 block">Action required</span>
              </div>

              {/* Card 4: Completed Appointments */}
              <div
                onClick={() => {
                  setAptStatusFilter('COMPLETED');
                  setActiveTab('appointments');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Completed
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-700">{stats.completedCount}</p>
                <span className="text-[10px] text-slate-400 block">Prescribed & finished</span>
              </div>

              {/* Card 5: Video Consultations (Google Meet) */}
              <div
                onClick={() => setActiveTab('video')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer space-y-2 col-span-2 lg:col-span-1"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Google Meet
                  </span>
                  <Video className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-700">{stats.videoCount}</p>
                <span className="text-[10px] text-slate-400 block">
                  {stats.pendingVideoLinks > 0 ? `${stats.pendingVideoLinks} links pending` : 'All links sent'}
                </span>
              </div>
            </div>

            {/* NEXT SCHEDULED PATIENT SECTION (Requirement 3) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                    <Clock4 className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Next Scheduled Patient</h2>
                    <p className="text-[11px] text-slate-400">Earliest upcoming clinical consultation</p>
                  </div>
                </div>
                {nextScheduledPatient && (
                  <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-full">
                    {nextScheduledPatient.appointmentDate} at {nextScheduledPatient.appointmentTime}
                  </span>
                )}
              </div>

              {nextScheduledPatient ? (
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-extrabold text-slate-900">
                        {nextScheduledPatient.patientName}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          nextScheduledPatient.consultationType === 'VIDEO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {nextScheduledPatient.consultationType === 'VIDEO' ? 'Google Meet Video' : 'In-Person Clinic'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Contact:</strong> {nextScheduledPatient.patientEmail || 'Email not specified'} • {nextScheduledPatient.patientPhone || ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong>Reason:</strong> {nextScheduledPatient.reason || 'General Consultation'}
                    </p>
                    {nextScheduledPatient.consultationType === 'VIDEO' && (
                      <div className="pt-1 flex items-center gap-2 text-xs">
                        {nextScheduledPatient.videoLinkSent ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Google Meet invitation sent to patient
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Google Meet link pending dispatch
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for next patient */}
                  <div className="flex flex-wrap items-center gap-2">
                    {nextScheduledPatient.consultationType === 'VIDEO' && (
                      <>
                        {nextScheduledPatient.videoLinkSent && nextScheduledPatient.googleMeetLink ? (
                          <a
                            href={nextScheduledPatient.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Google Meet</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenMeetModal(nextScheduledPatient)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Google Meet Invitation</span>
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(nextScheduledPatient.appointmentId, 'COMPLETED')}
                      className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Complete
                    </button>
                    <Link
                      to={`/doctor/prescriptions/new?appointmentId=${nextScheduledPatient.appointmentId}`}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Write Rx</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No upcoming appointments scheduled</p>
                  <p className="text-[11px] text-slate-400">
                    When patients book appointments with you, your next scheduled consultation will appear right here.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Overview Split: Today's visits & Google Meet Telehealth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Today's Appointments Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" /> Today's Consultation Schedule
                  </h3>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Timeline <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {todayAppointments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No consultations scheduled for today ({todayStr}).
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {todayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.appointmentId}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-extrabold text-slate-900">{apt.patientName}</p>
                          <span className="text-[11px] text-slate-500">
                            {apt.appointmentTime} • {apt.consultationType === 'VIDEO' ? 'Google Meet' : 'In-Person'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-teal-100 text-teal-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 2: Google Meet Quick Hub */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50/40 rounded-3xl p-6 border border-emerald-200/70 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Google Meet Telehealth Hub</h3>
                      <p className="text-[11px] text-emerald-800">Direct authorized consultations</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                    {stats.videoCount} Total Video Visits
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  QuickCare uses Google Meet exclusively for all video consultations. You can generate meeting links, dispatch invitation emails to patients, and launch sessions in 1 click.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('video')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Manage Video Consultations</span>
                  </button>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Generate Instant Link</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: APPOINTMENTS MANAGEMENT (Requirement 4)
        ========================================================================= */}
        {currentTab === 'appointments' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Appointments Management</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Review incoming requests, approve/reject bookings, manage Google Meet invitations, and write prescriptions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDoctorData}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAptStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        aptStatusFilter === st
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Consultation Type Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-bold">Type:</span>
                  <select
                    value={aptTypeFilter}
                    onChange={(e) => setAptTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">All Types</option>
                    <option value="VIDEO">Google Meet Video</option>
                    <option value="IN_PERSON">In-Person Clinic</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={aptSearchQuery}
                  onChange={(e) => setAptSearchQuery(e.target.value)}
                  placeholder="Search appointments by patient name, reason, or appointment ID..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Appointments List / Cards */}
            {appointments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="text-sm font-extrabold text-slate-700">No Appointments Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are no appointments registered under Dr. {cleanDoctorDisplay}. When patients select your profile, their appointments will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments
                  .filter((a) => {
                    const matchStatus = aptStatusFilter === 'ALL' || a.status === aptStatusFilter;
                    const matchType = aptTypeFilter === 'ALL' || a.consultationType === aptTypeFilter;
                    const q = aptSearchQuery.toLowerCase().trim();
                    const matchSearch =
                      !q ||
                      a.patientName?.toLowerCase().includes(q) ||
                      a.reason?.toLowerCase().includes(q) ||
                      a.appointmentId?.toLowerCase().includes(q);
                    return matchStatus && matchType && matchSearch;
                  })
                  .map((apt) => (
                    <AppointmentCard
                      key={apt.appointmentId}
                      appointment={apt}
                      role="DOCTOR"
                      onStatusChange={handleStatusChange}
                      onRefresh={fetchDoctorData}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: TODAY'S SCHEDULE (Requirement 5)
        ========================================================================= */}
        {currentTab === 'schedule' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Today's Schedule</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Chronological timeline of all consultations scheduled for today ({todayStr}).
                </p>
              </div>
              <div className="px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold rounded-xl">
                {todayAppointments.length} Consultations Today
              </div>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
                <Clock className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-base font-extrabold text-slate-800">No Appointments Scheduled for Today</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You have a clear schedule today ({todayStr}). You can manage your availability for upcoming days or write digital prescriptions for past cases.
                </p>
                <button
                  onClick={() => setActiveTab('availability')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Manage Availability Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((apt, index) => {
                  const isNext = index === 0;
                  return (
                    <div
                      key={apt.appointmentId}
                      className={`p-5 rounded-3xl border bg-white shadow-xs transition space-y-3 ${
                        isNext ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-teal-50 text-teal-800 font-mono font-black text-xs rounded-full">
                            {apt.appointmentTime}
                          </span>
                          {isNext && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full animate-pulse">
                              NEXT UP
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              apt.consultationType === 'VIDEO'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {apt.consultationType === 'VIDEO' ? 'Google Meet Video' : 'In-Person Clinic Visit'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-teal-100 text-teal-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-extrabold text-sm text-slate-900">{apt.patientName}</p>
                          <p className="text-xs text-slate-600">
                            Email: {apt.patientEmail || 'Not specified'} • Phone: {apt.patientPhone || 'Not specified'}
                          </p>
                          <p className="text-xs text-slate-500">
                            <strong>Chief Complaint:</strong> {apt.reason || 'General Health Consultation'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {apt.consultationType === 'VIDEO' && (
                            <>
                              {apt.videoLinkSent && apt.googleMeetLink ? (
                                <a
                                  href={apt.googleMeetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Launch Google Meet</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMeetModal(apt)}
                                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Meet Link</span>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(apt.appointmentId, 'COMPLETED')}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Mark Completed
                          </button>
                          <Link
                            to={`/doctor/prescriptions/new?appointmentId=${apt.appointmentId}`}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <FilePlus className="w-3.5 h-3.5" />
                            <span>Write Rx</span>
                          </Link>
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
            TAB 4: PATIENTS ROSTER (Requirement 6)
        ========================================================================= */}
        {currentTab === 'patients' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Assigned Patients</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Directory of distinct patients who have consulted with Dr. {cleanDoctorDisplay}.
                </p>
              </div>
              <div className="px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold rounded-xl">
                {patientRoster.length} Total Patients
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient roster by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Patients Table / Cards */}
            {patientRoster.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                <Users className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-sm font-extrabold text-slate-800">No Patients in Roster</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When patients book consultations with you, their medical records and contact details will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Patient Name</th>
                        <th className="px-5 py-3.5">Contact Details</th>
                        <th className="px-5 py-3.5">Total Visits</th>
                        <th className="px-5 py-3.5">Last Visit Date</th>
                        <th className="px-5 py-3.5">Latest Reason</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientRoster
                        .filter((p) => {
                          const q = patientSearch.toLowerCase().trim();
                          return (
                            !q ||
                            p.patientName.toLowerCase().includes(q) ||
                            p.patientEmail.toLowerCase().includes(q)
                          );
                        })
                        .map((pat) => (
                          <tr key={pat.patientUid || pat.patientEmail} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4 font-extrabold text-slate-900">{pat.patientName}</td>
                            <td className="px-5 py-4 text-slate-600">
                              <p className="font-mono text-[11px]">{pat.patientEmail}</p>
                              <p className="text-[10px] text-slate-400">{pat.patientPhone}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-black text-xs">
                                {pat.totalVisits} visit{pat.totalVisits > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-medium">
                              {pat.lastVisitDate} <span className="text-slate-400 text-[10px]">({pat.lastVisitTime})</span>
                            </td>
                            <td className="px-5 py-4 text-slate-600 max-w-xs truncate">{pat.latestReason}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedPatientHistory(pat)}
                                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl transition cursor-pointer"
                              >
                                View History
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: VIDEO CONSULTATIONS (GOOGLE MEET HUB - Requirement 7)
        ========================================================================= */}
        {currentTab === 'video' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header with Google Meet branding */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 text-white font-extrabold text-xs rounded-full backdrop-blur-md">
                    Telehealth Portal
                  </span>
                  <span className="px-3 py-1 bg-emerald-400/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-400/30">
                    Google Meet Exclusively
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Google Meet Telemedicine Hub
                </h1>
                <p className="text-teal-100 text-xs sm:text-sm max-w-xl">
                  QuickCare uses Google Meet as the ONLY video consultation method. Enter or generate valid Google Meet links and dispatch invitation emails to your patients with 1 click.
                </p>
              </div>

              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Create New Google Meet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Video Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'All Video Requests' },
                  { id: 'PENDING', label: 'Link Pending (Action Required)' },
                  { id: 'SENT', label: 'Link Sent (Ready to Join)' },
                  { id: 'COMPLETED', label: 'Completed' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setVideoFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      videoFilter === f.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  placeholder="Search video appointments..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Video Appointments List */}
            {appointments.filter((a) => a.consultationType === 'VIDEO').length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                <Video className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-sm font-extrabold text-slate-800">No Google Meet Consultations</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You do not have any pending video consultations at this time. When a patient books an online video slot, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments
                  .filter((a) => a.consultationType === 'VIDEO')
                  .filter((a) => {
                    if (videoFilter === 'PENDING') return !a.videoLinkSent && a.status !== 'CANCELLED';
                    if (videoFilter === 'SENT') return a.videoLinkSent && a.status !== 'CANCELLED' && a.status !== 'COMPLETED';
                    if (videoFilter === 'COMPLETED') return a.status === 'COMPLETED';
                    return true;
                  })
                  .filter((a) => {
                    const q = videoSearch.toLowerCase().trim();
                    return !q || a.patientName?.toLowerCase().includes(q) || a.patientEmail?.toLowerCase().includes(q);
                  })
                  .map((apt) => (
                    <div
                      key={apt.appointmentId}
                      className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-full flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-emerald-600" /> Google Meet Video
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {apt.appointmentDate} at {apt.appointmentTime}
                          </span>
                        </div>

                        {apt.videoLinkSent ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Google Meet Invitation Sent
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Pending Doctor Invitation
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-sm text-slate-900">{apt.patientName}</p>
                          <p className="text-xs text-slate-600">
                            Registered Email: <strong>{apt.patientEmail || 'Not specified'}</strong>
                          </p>
                          <p className="text-xs text-slate-500">
                            <strong>Reason:</strong> {apt.reason || 'General Online Telehealth Consultation'}
                          </p>
                          {apt.googleMeetLink && (
                            <p className="text-xs font-mono text-emerald-700 font-semibold pt-1 truncate max-w-md">
                              Link: {apt.googleMeetLink}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {apt.videoLinkSent && apt.googleMeetLink ? (
                            <>
                              <a
                                href={apt.googleMeetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Launch Google Meet</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleOpenMeetModal(apt)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Update Link
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenMeetModal(apt)}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Google Meet Invitation</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 6: MY AVAILABILITY (Requirement 8)
        ========================================================================= */}
        {currentTab === 'availability' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Manage Availability</h1>
              <p className="text-xs text-slate-500 mt-1">
                Configure your active consulting days, operational hours, slot durations, and break windows.
              </p>
            </div>

            {availabilitySuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{availabilitySuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAvailability} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              {/* Available Days */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                  1. Working Days (Available for Appointments)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isChecked = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (availableDays.length > 1) {
                              setAvailableDays(availableDays.filter((d) => d !== day));
                            }
                          } else {
                            setAvailableDays([...availableDays, day]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-teal-50 border-teal-500 text-teal-800'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <span>{day.slice(0, 3)}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Working Start Time</label>
                    <span className="text-[10px] font-medium text-slate-400">First slot start</span>
                  </div>
                  <input
                    type="text"
                    value={workingStartTime}
                    onChange={(e) => setWorkingStartTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['08:00 AM', '09:00 AM', '10:00 AM'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setWorkingStartTime(t)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          workingStartTime === t
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Working End Time</label>
                    <span className="text-[10px] font-bold text-teal-600">Booking open till this time</span>
                  </div>
                  <input
                    type="text"
                    value={workingEndTime}
                    onChange={(e) => setWorkingEndTime(e.target.value)}
                    placeholder="e.g. 05:00 PM or 08:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setWorkingEndTime(t)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          workingEndTime === t
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot Duration & Break Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Slot Duration</label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Break Start Time</label>
                  <input
                    type="text"
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    placeholder="e.g. 01:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Break End Time</label>
                  <input
                    type="text"
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    placeholder="e.g. 02:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingAvailability}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer"
                >
                  {savingAvailability ? 'Saving Schedule...' : 'Save Availability Schedule'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 7: NOTIFICATIONS (Requirement 9)
        ========================================================================= */}
        {currentTab === 'notifications' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Doctor Notifications</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Updates on new appointment requests, Google Meet actions, and patient check-ins.
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('quickcare_notifications');
                    setNotifications([]);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                <Bell className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-sm font-extrabold text-slate-800">No Notifications</h3>
                <p className="text-xs text-slate-400">You are all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3"
                  >
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-xs text-slate-900">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.timestamp || 'Recent'}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 8: MY PROFILE (Requirement 10)
        ========================================================================= */}
        {currentTab === 'profile' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Doctor Profile</h1>
              <p className="text-xs text-slate-500 mt-1">
                Maintain your clinical credentials, specialization, consultation fee, and clinic details.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-extrabold text-slate-600">
                      Dr.
                    </span>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="e.g. Atharva"
                      required
                      className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Specialization</label>
                  <select
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Qualifications</label>
                  <input
                    type="text"
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Years of Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={profileForm.consultationFee}
                    onChange={(e) => setProfileForm({ ...profileForm, consultationFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Medical Council Registration No.</label>
                  <input
                    type="text"
                    value={profileForm.medicalRegistrationNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, medicalRegistrationNumber: e.target.value })}
                    placeholder="e.g. MCI-12345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Clinic / Hospital Affiliation</label>
                  <input
                    type="text"
                    value={profileForm.clinicAddress}
                    onChange={(e) => setProfileForm({ ...profileForm, clinicAddress: e.target.value })}
                    placeholder="e.g. QuickCare Telehealth Center"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Doctor Bio & Specialty Summary</label>
                <textarea
                  rows="3"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Summarize your clinical expertise and practice philosophy..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer"
                >
                  {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: SEND / UPDATE GOOGLE MEET INVITATION (Requirement Part 1)
      ========================================================================= */}
      {selectedVideoApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Send Google Meet Invitation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: {selectedVideoApt.patientName} ({selectedVideoApt.patientEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoApt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Meet is the only video consultation platform</span>
              </p>
              <p className="text-[11px] text-emerald-800">
                When you click "Send Google Meet Invitation", an invitation email will be dispatched to <strong>{selectedVideoApt.patientEmail}</strong> with appointment details and the direct Google Meet link.
              </p>
            </div>

            <form onSubmit={handleSendGoogleMeetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Google Meet URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoGenerateMeetLink}
                      className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Fill Room
                    </button>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Create on Google Meet
                    </a>
                  </div>
                </div>
                <input
                  type="url"
                  value={meetLinkInput}
                  onChange={(e) => {
                    setMeetLinkInput(e.target.value);
                    setMeetModalError('');
                  }}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400">
                  Must be a valid Google Meet link (e.g. https://meet.google.com/abc-defg-hij)
                </p>
              </div>

              {meetModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{meetModalError}</span>
                </div>
              )}

              {meetModalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{meetModalSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedVideoApt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMeetLink || !meetLinkInput.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingMeetLink ? 'Sending Invitation...' : 'Send Google Meet Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW PATIENT MEDICAL HISTORY (Requirement 6)
      ========================================================================= */}
      {selectedPatientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedPatientHistory.patientName} - Consultation History
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedPatientHistory.patientEmail} • {selectedPatientHistory.patientPhone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Visits with Dr. {cleanDoctorDisplay} ({selectedPatientHistory.appointments.length})
              </h4>
              {selectedPatientHistory.appointments.map((apt) => (
                <div key={apt.appointmentId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      {apt.appointmentDate} at {apt.appointmentTime}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apt.status === 'CONFIRMED'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Type:</strong> {apt.consultationType === 'VIDEO' ? 'Google Meet Video' : 'In-Person Clinic Visit'}
                  </p>
                  <p className="text-slate-500">
                    <strong>Chief Complaint:</strong> {apt.reason || 'General Consultation'}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPatientHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};