import api from './api';
import { DEFAULT_DOCTORS } from './doctorService';

const DOCTORS_STORAGE_KEY = 'quickcare_shared_doctors';
const USERS_STORAGE_KEY = 'quickcare_all_registered_users';

// Cross-tab broadcast channel for instantaneous real-time sync (< 5ms)
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('quickcare_realtime_sync');
  }
} catch (e) {}

export const broadcastDoctorUpdate = (payload = {}) => {
  if (typeof window !== 'undefined') {
    // 1. Same-window custom event
    window.dispatchEvent(new CustomEvent('quickcare_doctors_updated', { detail: payload }));
    // 2. Cross-tab BroadcastChannel (< 5ms)
    try {
      if (syncChannel) {
        syncChannel.postMessage({ type: 'DOCTORS_UPDATED', ...payload, timestamp: Date.now() });
      }
    } catch (e) {}
  }
};

export const getLocalDoctors = () => {
  try {
    const raw = localStorage.getItem(DOCTORS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalDoctors = (list) => {
  try {
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem('quickcare_doctor_last_updated', Date.now().toString());
    broadcastDoctorUpdate({ count: list.length });
  } catch (e) {
    console.error('Failed to save doctors locally:', e);
  }
};

// Returns synchronous, sorted doctor list (including pending approvals) with 0ms delay
export const getImmediateDoctorsList = () => {
  const localDocs = getLocalDoctors();

  try {
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      users.forEach((u) => {
        if (u && (u.role || '').toUpperCase() === 'DOCTOR') {
          const normEmail = (u.email || '').toLowerCase().trim();
          const exists = localDocs.some((d) => (d.email || '').toLowerCase().trim() === normEmail);
          if (!exists) {
            const uid = u.userId || u.uid || `usr_${Date.now().toString(36)}`;
            const doctorId = u.doctorId || (uid.startsWith('doc_') ? uid : `doc_${uid}`);
            localDocs.unshift({
              doctorId,
              uid,
              fullName: (u.fullName || 'Doctor').startsWith('Dr.') ? u.fullName : `Dr. ${u.fullName || 'Doctor'}`,
              email: normEmail,
              phone: u.phone || '',
              gender: u.gender || 'Female',
              specialization: u.specialization || 'General Physician',
              qualification: u.qualification || 'MBBS',
              experience: Number(u.experience) || 5,
              medicalRegistrationNumber: u.medicalRegistrationNumber || 'REG-PENDING',
              consultationFee: Number(u.consultationFee) || 500,
              workingHours: u.workingHours || '09:00 AM - 05:00 PM',
              workingStartTime: u.workingStartTime || '09:00 AM',
              workingEndTime: u.workingEndTime || '05:00 PM',
              clinicAddress: u.clinicAddress || 'QuickCare Medical Center',
              bio: u.bio || 'Consultant practitioner at QuickCare Healthcare',
              verificationStatus: u.verificationStatus || 'PENDING',
              approvalStatus: u.approvalStatus || 'PENDING',
              status: u.status || 'ACTIVE',
              isRecentlyAdded: true,
              createdAt: u.createdAt || new Date().toISOString(),
            });
          }
        }
      });
    }
  } catch (e) {}

  const mergedMap = new Map();
  DEFAULT_DOCTORS.forEach((d) => {
    mergedMap.set(d.doctorId, { ...d, verificationStatus: d.verificationStatus || 'VERIFIED' });
  });

  localDocs.forEach((d) => {
    if (d && d.doctorId) {
      const prev = mergedMap.get(d.doctorId) || {};
      mergedMap.set(d.doctorId, { ...prev, ...d });
    }
  });

  const allDoctors = Array.from(mergedMap.values());
  allDoctors.sort((a, b) => {
    if (a.verificationStatus === 'PENDING' && b.verificationStatus !== 'PENDING') return -1;
    if (b.verificationStatus === 'PENDING' && a.verificationStatus !== 'PENDING') return 1;
    if (a.isRecentlyAdded && !b.isRecentlyAdded) return -1;
    if (b.isRecentlyAdded && !a.isRecentlyAdded) return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return allDoctors;
};

// Helper to register or sync a doctor into shared doctors store
export const registerDoctorToSharedRegistry = (doctorData) => {
  const currentList = getLocalDoctors();
  const uid = doctorData.userId || doctorData.uid || `usr_${Date.now().toString(36)}`;
  const doctorId = doctorData.doctorId || (uid.startsWith('doc_') ? uid : `doc_${uid}`);
  const normEmail = (doctorData.email || '').toLowerCase().trim();

  const newDoc = {
    doctorId,
    uid,
    fullName: (doctorData.fullName || 'Doctor').startsWith('Dr.') ? doctorData.fullName : `Dr. ${doctorData.fullName || 'Doctor'}`,
    email: normEmail,
    phone: doctorData.phone || '',
    gender: doctorData.gender || 'Female',
    profileImage: doctorData.profileImage || (doctorData.gender === 'Male'
      ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
      : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'),
    specialization: doctorData.specialization || 'General Physician',
    qualification: doctorData.qualification || 'MBBS, MD',
    experience: Number(doctorData.experience) || 5,
    medicalRegistrationNumber: doctorData.medicalRegistrationNumber || ('REG-' + Date.now().toString().slice(-6)),
    consultationFee: Number(doctorData.consultationFee) || 500,
    workingHours: doctorData.workingHours || '09:00 AM - 05:00 PM',
    workingStartTime: doctorData.workingStartTime || '09:00 AM',
    workingEndTime: doctorData.workingEndTime || '05:00 PM',
    slotDurationMinutes: 15,
    clinicAddress: doctorData.clinicAddress || 'QuickCare Telehealth Center',
    bio: doctorData.bio || 'Consultant practitioner at QuickCare Healthcare',
    verificationStatus: doctorData.verificationStatus || 'PENDING',
    status: doctorData.status || 'ACTIVE',
    rating: 5.0,
    reviewCount: 0,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    createdAt: doctorData.createdAt || new Date().toISOString(),
    isRecentlyAdded: true,
  };

  const existingIdx = currentList.findIndex(
    (d) => (d.email || '').toLowerCase().trim() === normEmail || d.doctorId === doctorId
  );

  if (existingIdx >= 0) {
    currentList[existingIdx] = { ...currentList[existingIdx], ...newDoc };
  } else {
    currentList.unshift(newDoc);
  }

  saveLocalDoctors(currentList);
  return newDoc;
};

export const adminService = {
  getImmediateDoctors() {
    return getImmediateDoctorsList();
  },

  async getDashboardStats() {
    const doctors = getImmediateDoctorsList();
    const verifiedCount = doctors.filter((d) => d.verificationStatus === 'VERIFIED').length;
    const pendingCount = doctors.filter((d) => d.verificationStatus === 'PENDING').length;

    const specStats = {};
    doctors.forEach((d) => {
      const spec = d.specialization || 'General Physician';
      specStats[spec] = (specStats[spec] || 0) + 1;
    });

    let remoteStats = null;
    try {
      const res = await api.get('/admin/dashboard');
      if (res && res.data && res.data.data) {
        remoteStats = res.data.data;
      }
    } catch (err) {
      console.warn('Backend dashboard stats offline, computing synchronized statistics:', err.message);
    }

    return {
      success: true,
      data: {
        totalDoctors: doctors.length,
        verifiedDoctors: verifiedCount,
        pendingDoctorApprovals: pendingCount,
        activeDoctors: verifiedCount,
        totalUsers: remoteStats?.totalUsers || (1420 + doctors.length),
        totalAppointments: remoteStats?.totalAppointments || 3240,
        activeConsultations: remoteStats?.activeConsultations || 3,
        todayAppointments: remoteStats?.todayAppointments || 12,
        specializationStats: specStats,
        ...remoteStats,
        // Enforce true live doctor values
        pendingDoctorApprovals: pendingCount,
        verifiedDoctors: verifiedCount,
        totalDoctors: doctors.length,
      },
    };
  },

  async getAllDoctors() {
    // 1. Gather all local registered doctors
    const localDocs = getLocalDoctors();

    // 2. Scan quickcare_all_registered_users for any registered DOCTOR users
    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        users.forEach((u) => {
          if (u && (u.role || '').toUpperCase() === 'DOCTOR') {
            const normEmail = (u.email || '').toLowerCase().trim();
            const exists = localDocs.some((d) => (d.email || '').toLowerCase().trim() === normEmail);
            if (!exists) {
              const createdDoc = registerDoctorToSharedRegistry(u);
              localDocs.unshift(createdDoc);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Failed reading registered users for doctor sync:', e);
    }

    // 3. Try fetching from backend API
    let remoteDocs = [];
    try {
      const res = await api.get('/admin/doctors');
      if (res && res.data && Array.isArray(res.data.data || res.data)) {
        remoteDocs = res.data.data || res.data;
      }
    } catch (err) {
      console.warn('Backend /admin/doctors API offline or starting, serving synchronized roster:', err.message);
    }

    // 4. Merge: Local Doctors (with priority) + Remote Doctors + DEFAULT_DOCTORS
    const mergedMap = new Map();

    // First add all seed doctors
    DEFAULT_DOCTORS.forEach((d) => {
      mergedMap.set(d.doctorId, { ...d, verificationStatus: d.verificationStatus || 'VERIFIED' });
    });

    // Next merge remote doctors
    remoteDocs.forEach((d) => {
      if (d && d.doctorId) {
        mergedMap.set(d.doctorId, { ...mergedMap.get(d.doctorId), ...d });
      }
    });

    // Finally override with local registered doctors (ensuring newly added / modified doctors are preserved)
    localDocs.forEach((d) => {
      if (d && d.doctorId) {
        const prev = mergedMap.get(d.doctorId) || {};
        mergedMap.set(d.doctorId, { ...prev, ...d });
      }
    });

    const allDoctors = Array.from(mergedMap.values());

    // Sort: PENDING and Recently Added doctors appear at the very top!
    allDoctors.sort((a, b) => {
      if (a.verificationStatus === 'PENDING' && b.verificationStatus !== 'PENDING') return -1;
      if (b.verificationStatus === 'PENDING' && a.verificationStatus !== 'PENDING') return 1;
      if (a.isRecentlyAdded && !b.isRecentlyAdded) return -1;
      if (b.isRecentlyAdded && !a.isRecentlyAdded) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return {
      success: true,
      data: allDoctors,
    };
  },

  async getAllPatients() {
    try {
      const res = await api.get('/admin/patients');
      if (res && res.data) return res.data;
    } catch (e) {}

    // Fallback: extract patients from registered users
    const defaultPatients = [
      { userId: 'usr_pat_01', fullName: 'Aarav Sharma', email: 'aarav@example.com', phone: '+91 98765 43210', gender: 'Male', status: 'ACTIVE' },
      { userId: 'usr_pat_02', fullName: 'Meera Nair', email: 'meera@example.com', phone: '+91 98765 43211', gender: 'Female', status: 'ACTIVE' },
      { userId: 'usr_pat_03', fullName: 'Rohan Patel', email: 'rohan@example.com', phone: '+91 98765 43212', gender: 'Male', status: 'ACTIVE' },
    ];
    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const registeredPatients = users.filter((u) => (u.role || '').toUpperCase() === 'PATIENT');
        if (registeredPatients.length > 0) {
          return { success: true, data: [...registeredPatients, ...defaultPatients] };
        }
      }
    } catch (e) {}

    return { success: true, data: defaultPatients };
  },

  async getAllAppointments() {
    try {
      const res = await api.get('/admin/appointments');
      if (res && res.data) return res.data;
    } catch (e) {}
    try {
      const raw = localStorage.getItem('quickcare_shared_appointments');
      if (raw) {
        return { success: true, data: JSON.parse(raw) };
      }
    } catch (e) {}
    return { success: true, data: [] };
  },

  async verifyDoctor(doctorId, approve, feedback = '') {
    const newStatus = approve ? 'VERIFIED' : 'REJECTED';
    const localDocs = getLocalDoctors();
    const docIdx = localDocs.findIndex((d) => d.doctorId === doctorId || d.uid === doctorId);
    let updatedDoctor = null;

    if (docIdx >= 0) {
      localDocs[docIdx] = {
        ...localDocs[docIdx],
        verificationStatus: newStatus,
        approvalStatus: newStatus,
        rejectionReason: approve ? '' : (feedback || 'Credentials could not be verified by medical board.'),
        isRecentlyAdded: false,
        verifiedAt: new Date().toISOString(),
        feedback,
      };
      updatedDoctor = localDocs[docIdx];
      saveLocalDoctors(localDocs);
    } else {
      // Find from DEFAULT_DOCTORS if existing seed doctor
      const seed = DEFAULT_DOCTORS.find((d) => d.doctorId === doctorId);
      if (seed) {
        updatedDoctor = {
          ...seed,
          verificationStatus: newStatus,
          approvalStatus: newStatus,
          rejectionReason: approve ? '' : (feedback || 'Credentials could not be verified by medical board.'),
          isRecentlyAdded: false,
          verifiedAt: new Date().toISOString(),
          feedback,
        };
        localDocs.unshift(updatedDoctor);
        saveLocalDoctors(localDocs);
      }
    }

    // Also update quickcare_all_registered_users
    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const uIdx = users.findIndex(
          (u) => u.userId === doctorId || `doc_${u.userId}` === doctorId || u.uid === doctorId || `doc_${u.uid}` === doctorId
        );
        if (uIdx >= 0) {
          users[uIdx].accountStatus = approve ? 'ACTIVE' : 'INACTIVE';
          users[uIdx].verificationStatus = newStatus;
          users[uIdx].approvalStatus = newStatus;
          users[uIdx].rejectionReason = approve ? '' : (feedback || 'Credentials could not be verified by medical board.');
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch (e) {}

    // Dispatch notification to doctor
    try {
      const notifRaw = localStorage.getItem('quickcare_shared_notifications');
      const notifList = notifRaw ? JSON.parse(notifRaw) : [];
      notifList.unshift({
        notificationId: `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        recipientUid: doctorId,
        recipientEmail: updatedDoctor?.email || '',
        title: approve ? 'Medical Registration Approved' : 'Registration Application Review Notice',
        message: approve
          ? 'Congratulations! Your medical qualification certificates have been verified by the medical board. Your profile is now active for patient bookings.'
          : `Your doctor registration application was rejected. Reason: ${feedback || 'Credentials could not be verified'}. You may update your documents and resubmit.`,
        type: approve ? 'DOCTOR_VERIFIED' : 'DOCTOR_REJECTED',
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      localStorage.setItem('quickcare_shared_notifications', JSON.stringify(notifList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quickcare_notifications_updated'));
      }
    } catch (e) {}

    // Dispatch update event immediately (0ms)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickcare_doctors_updated', { detail: { doctorId, status: newStatus } }));
    }

    // Call backend asynchronously
    try {
      const res = await api.put(`/admin/doctors/${doctorId}/verify`, {
        approve,
        feedback,
        rejectionReason: feedback,
      });
      if (res && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend doctor verification call offline, updated synchronized store:', err.message);
    }

    return {
      success: true,
      message: `Doctor status updated to ${newStatus}`,
      data: updatedDoctor,
    };
  },

  async updateUserStatus(userId, status) {
    try {
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const idx = users.findIndex((u) => u.userId === userId || u.uid === userId);
        if (idx >= 0) {
          users[idx].status = status;
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch (e) {}

    try {
      const res = await api.put(`/admin/users/${userId}/status`, { status });
      return res.data;
    } catch (err) {
      console.warn('Backend updateUserStatus API offline, updated locally:', err.message);
      return { success: true, message: `User status updated to ${status}` };
    }
  },
};
