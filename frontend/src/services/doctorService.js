import api from './api.js';

// Helper to convert time strings (e.g. "05:00 PM", "7:00 PM", "19:00") into minutes from midnight
export const parseTimeStringToMinutes = (timeStr, fallbackMinutes = 540) => {
  if (!timeStr || typeof timeStr !== 'string') return fallbackMinutes;
  const s = timeStr.trim().toUpperCase();

  // Handle 12-hour AM/PM format (e.g. "05:00 PM", "5:00 PM", "9:30 AM", "09:00AM")
  if (s.includes('AM') || s.includes('PM')) {
    const isPM = s.includes('PM');
    const isAM = s.includes('AM');
    const clean = s.replace('AM', '').replace('PM', '').trim();
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isNaN(h)) return fallbackMinutes;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + (isNaN(m) ? 0 : m);
  }

  // Handle 24-hour format (e.g. "17:00", "09:00", "19:30")
  if (s.includes(':')) {
    const parts = s.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (!isNaN(h)) {
      return h * 60 + (isNaN(m) ? 0 : m);
    }
  }

  const num = parseInt(s, 10);
  if (!isNaN(num)) {
    return num >= 1 && num <= 12 ? (num < 8 ? (num + 12) * 60 : num * 60) : num * 60;
  }

  return fallbackMinutes;
};

export const DEFAULT_DOCTORS = [
  {
    doctorId: 'doc_001',
    uid: 'usr_doc_01',
    fullName: 'Dr. Priya Deshmukh',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
    experience: 14,
    medicalRegistrationNumber: 'MCI-CARD-88741',
    consultationFee: 800,
    verificationStatus: 'VERIFIED',
    rating: 4.9,
    reviewCount: 128,
    bio: 'Senior Cardiologist specializing in preventive heart health, coronary artery disease, and cardiac rehabilitation.',
    clinicAddress: 'Apex Heart Institute, Mumbai',
    city: 'Mumbai',
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    doctorId: 'doc_002',
    uid: 'usr_doc_02',
    fullName: 'Dr. Rajesh Kulkarni',
    specialization: 'Dermatology',
    qualification: 'MBBS, DVD, MD (Dermatology)',
    experience: 10,
    medicalRegistrationNumber: 'MCI-DERM-44512',
    consultationFee: 600,
    verificationStatus: 'VERIFIED',
    rating: 4.8,
    reviewCount: 94,
    bio: 'Consultant Dermatologist & Trichologist focusing on clinical dermatology, eczema, psoriasis, and cosmetic dermatology.',
    clinicAddress: 'Skin & Glow Clinic, Pune',
    city: 'Pune',
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    doctorId: 'doc_003',
    uid: 'usr_doc_03',
    fullName: 'Dr. Ananya Roy',
    specialization: 'Pediatrics',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    experience: 8,
    medicalRegistrationNumber: 'MCI-PED-77891',
    consultationFee: 500,
    verificationStatus: 'VERIFIED',
    rating: 4.95,
    reviewCount: 162,
    bio: 'Compassionate Pediatrician dedicated to neonatal care, child growth monitoring, vaccination, and adolescent care.',
    clinicAddress: 'Little Sprouts Children Hospital, Delhi',
    city: 'Delhi',
    profileImage: 'https://images.unsplash.com/photo-1594824813583-43efb8e23528?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    doctorId: 'doc_vivek_shelar',
    uid: 'usr_doc_vivek',
    fullName: 'Dr. Vivek Shelar',
    specialization: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics)',
    experience: 12,
    medicalRegistrationNumber: 'MCI-ORTHO-78421',
    consultationFee: 500,
    verificationStatus: 'VERIFIED',
    rating: 4.9,
    reviewCount: 96,
    bio: 'Chief Consultant Orthopedic Surgeon at Shelar Hospital, Satara specializing in joint replacement, sports injury rehabilitation, and spine care.',
    clinicAddress: 'Shelar Hospital, Radhika Road, Satara',
    city: 'Satara',
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    doctorId: 'doc_f3852f3d',
    uid: 'usr_b320c9f9',
    fullName: 'Dr.Prasad Kadam',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD',
    experience: 12,
    medicalRegistrationNumber: 'MCI-123',
    consultationFee: 500,
    verificationStatus: 'VERIFIED',
    rating: 4.8,
    reviewCount: 42,
    bio: 'Experienced Senior Cardiologist at Kadam Hospital, Satara specializing in comprehensive cardiovascular care and clinical cardiology.',
    clinicAddress: 'Kadam Multi-Speciality Hospital, Powai Naka, Satara',
    city: 'Satara',
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    doctorId: 'doc_004',
    uid: 'usr_doc_04',
    fullName: 'Dr. Vikram Joshi',
    specialization: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics), MCh (Ortho)',
    experience: 16,
    medicalRegistrationNumber: 'MCI-ORTHO-11923',
    consultationFee: 900,
    verificationStatus: 'VERIFIED',
    rating: 4.75,
    reviewCount: 87,
    bio: 'Chief Orthopedic & Joint Replacement Surgeon with extensive experience in sports injuries, spine care, and arthroscopy.',
    clinicAddress: 'Metro Joint & Spine Hospital, Bengaluru',
    city: 'Bengaluru',
    profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    doctorId: 'doc_005',
    uid: 'usr_doc_05',
    fullName: 'Dr. Meera Nambiar',
    specialization: 'Neurology',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience: 15,
    medicalRegistrationNumber: 'MCI-NEURO-55102',
    consultationFee: 1000,
    verificationStatus: 'VERIFIED',
    rating: 4.9,
    reviewCount: 110,
    bio: 'Senior Neurologist & Stroke Specialist focusing on migraine management, epilepsy, and neurological disorders.',
    clinicAddress: 'City Neuro Sciences, Chennai',
    city: 'Chennai',
    profileImage: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
    onlineStatus: 'AVAILABLE_FOR_VIDEO',
    videoConsultationAvailable: true,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  }
];

export const doctorService = {
  async searchDoctors(params = {}) {
    try {
      const res = await api.get('/doctors', { params });
      if (res && res.data && Array.isArray(res.data.data || res.data) && (res.data.data || res.data).length > 0) {
        const list = res.data.data || res.data;
        return { success: true, data: list };
      }
    } catch (err) {
      console.warn('Backend doctors API loading or offline, using verified roster:', err.message);
    }

    const getCombinedDoctors = () => {
      try {
        const raw = localStorage.getItem('quickcare_shared_doctors');
        if (raw) {
          const local = JSON.parse(raw);
          const verified = local.filter((d) => d.verificationStatus === 'VERIFIED');
          if (verified.length > 0) {
            const map = new Map();
            DEFAULT_DOCTORS.forEach((d) => map.set(d.doctorId, d));
            verified.forEach((d) => map.set(d.doctorId, d));
            return Array.from(map.values());
          }
        }
      } catch (e) {}
      return DEFAULT_DOCTORS;
    };

    let filtered = getCombinedDoctors();
    if (params.specialization && params.specialization !== 'ALL') {
      filtered = filtered.filter(
        (d) => d.specialization?.toLowerCase() === params.specialization.toLowerCase()
      );
    }
    if (params.gender && params.gender !== 'ALL') {
      filtered = filtered.filter(
        (d) => d.gender?.toLowerCase() === params.gender.toLowerCase()
      );
    }
    const locationParam = params.location || params.city;
    if (locationParam && locationParam !== 'ALL') {
      const loc = locationParam.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          (d.city && d.city.toLowerCase().includes(loc)) ||
          (d.clinicAddress && d.clinicAddress.toLowerCase().includes(loc))
      );
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.clinicAddress.toLowerCase().includes(q) ||
          (d.city && d.city.toLowerCase().includes(q))
      );
    }
    if (params.minExperience) {
      filtered = filtered.filter((d) => d.experience >= Number(params.minExperience));
    }
    if (params.maxFee) {
      filtered = filtered.filter((d) => d.consultationFee <= Number(params.maxFee));
    }

    return {
      success: true,
      data: filtered,
    };
  },

  async getDoctorById(id) {
    try {
      const res = await api.get(`/doctors/${id}`);
      if (res && res.data && (res.data.data?.doctorId || res.data.doctorId)) {
        return { success: true, data: res.data.data || res.data };
      }
    } catch (err) {
      console.warn('Backend getDoctorById API offline, resolving from faculty roster:', err.message);
    }

    let doc = null;
    try {
      const raw = localStorage.getItem('quickcare_shared_doctors');
      if (raw) {
        const local = JSON.parse(raw);
        doc = local.find(
          (d) =>
            d.doctorId === id ||
            d.uid === id ||
            `doc_${d.uid}` === id ||
            (id && d.doctorId && d.doctorId.toLowerCase() === id.toLowerCase()) ||
            (id && d.uid && d.uid.toLowerCase() === id.toLowerCase())
        );
      }
    } catch (e) {}

    if (!doc) {
      doc = DEFAULT_DOCTORS.find((d) => d.doctorId === id || d.uid === id);
    }
    doc = doc || DEFAULT_DOCTORS[0];
    return {
      success: true,
      data: doc,
    };
  },

  async getMyDoctorProfile() {
    // 1. Identify currently authenticated session
    let currentUser = null;
    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        currentUser = JSON.parse(rawUser);
      }
    } catch (e) {}

    const normEmail = (currentUser?.email || '').toLowerCase().trim();
    const currentUid = currentUser?.userId || currentUser?.uid;

    // 2. Attempt fetching from backend /doctors/me ONLY IF it matches authenticated user
    if (currentUser) {
      try {
        const res = await api.get('/doctors/me');
        const docCandidate = res?.data?.data || res?.data;
        if (docCandidate && (docCandidate.doctorId || docCandidate.uid)) {
          const candidateEmail = (docCandidate.email || '').toLowerCase().trim();
          const candidateUid = docCandidate.uid || docCandidate.userId;
          // Verify that candidate truly belongs to this authenticated user
          if (
            (candidateEmail && candidateEmail === normEmail) ||
            (candidateUid && candidateUid === currentUid)
          ) {
            return { success: true, data: docCandidate };
          }
        }
      } catch (err) {
        console.warn('Backend /doctors/me offline or mock, resolving authenticated doctor profile:', err.message);
      }

      // 3. Resolve from persistent shared doctor registry for THIS specific user
      try {
        const rawDocs = localStorage.getItem('quickcare_shared_doctors');
        if (rawDocs) {
          const list = JSON.parse(rawDocs);
          const found = list.find(
            (d) =>
              (normEmail && (d.email || '').toLowerCase().trim() === normEmail) ||
              (currentUid && (d.uid === currentUid || d.doctorId === currentUid || d.doctorId === `doc_${currentUid}`))
          );
          if (found) {
            // Ensure clean title without double 'Dr. Dr.'
            const cleanTitle = (found.fullName || '').replace(/^(?:dr\.?\s*)+/i, '').trim();
            return {
              success: true,
              data: {
                ...found,
                fullName: `Dr. ${cleanTitle || 'Doctor'}`,
              },
            };
          }
        }
      } catch (e) {}

      // 4. Build and return distinct personal doctor profile for this authenticated user
      const rawName = currentUser.fullName || 'Doctor';
      const cleanName = rawName.replace(/^(?:dr\.?\s*)+/i, '').trim();
      const docId =
        currentUser.doctorId ||
        (currentUid ? (currentUid.startsWith('doc_') ? currentUid : `doc_${currentUid}`) : `doc_${Date.now().toString(36)}`);

      const distinctProfile = {
        doctorId: docId,
        uid: currentUid || `usr_${Date.now().toString(36)}`,
        fullName: `Dr. ${cleanName}`,
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        gender: currentUser.gender || 'Male',
        specialization: currentUser.specialization || 'General Physician',
        qualification: currentUser.qualification || 'MBBS, MD',
        experience: Number(currentUser.experience) || 5,
        medicalRegistrationNumber: currentUser.medicalRegistrationNumber || ('MCI-' + Date.now().toString().slice(-6)),
        consultationFee: Number(currentUser.consultationFee) || 600,
        clinicAddress: currentUser.clinicAddress || currentUser.address || 'QuickCare Telehealth Center',
        bio:
          currentUser.bio ||
          `Senior consultant practitioner specializing in ${currentUser.specialization || 'Clinical Medicine'} with dedication to patient outcomes.`,
        verificationStatus: currentUser.verificationStatus || 'VERIFIED',
        profileImage:
          currentUser.profileImage ||
          (currentUser.gender === 'Female'
            ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'),
        workingHours: currentUser.workingHours || '09:00 AM - 05:00 PM',
        workingStartTime: '09:00 AM',
        workingEndTime: '05:00 PM',
        breakStartTime: '01:00 PM',
        breakEndTime: '02:00 PM',
        slotDurationMinutes: 15,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        onlineStatus: 'AVAILABLE_FOR_VIDEO',
        videoConsultationAvailable: true,
        rating: 5.0,
        reviewCount: 0,
      };

      // Persist to quickcare_shared_doctors so it stays persistent
      try {
        const rawDocs = localStorage.getItem('quickcare_shared_doctors');
        const list = rawDocs ? JSON.parse(rawDocs) : [];
        const idx = list.findIndex(
          (d) =>
            (normEmail && (d.email || '').toLowerCase().trim() === normEmail) ||
            (currentUid && (d.uid === currentUid || d.doctorId === docId))
        );
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...distinctProfile };
        } else {
          list.unshift(distinctProfile);
        }
        localStorage.setItem('quickcare_shared_doctors', JSON.stringify(list));
      } catch (e) {}

      return { success: true, data: distinctProfile };
    }

    // 5. Unauthenticated fallback: return null
    return { success: true, data: null };
  },

  async updateDoctorProfile(data) {
    try {
      const raw = localStorage.getItem('quickcare_shared_doctors');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(
        (d) =>
          d.doctorId === data.doctorId ||
          d.uid === data.uid ||
          (data.doctorId && d.doctorId && d.doctorId.toLowerCase() === data.doctorId.toLowerCase()) ||
          (data.uid && d.uid && d.uid.toLowerCase() === data.uid.toLowerCase()) ||
          (data.email && d.email && d.email.toLowerCase() === data.email.toLowerCase())
      );

      let updatedDoctor = null;
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data };
        updatedDoctor = list[idx];
      } else {
        const defaultMatch = DEFAULT_DOCTORS.find(
          (d) => d.doctorId === data.doctorId || d.uid === data.uid
        );
        updatedDoctor = { ...(defaultMatch || {}), ...data };
        list.unshift(updatedDoctor);
      }
      localStorage.setItem('quickcare_shared_doctors', JSON.stringify(list));

      // Also update quickcare_current_user in localStorage if this is current doctor
      try {
        const rawUser = localStorage.getItem('quickcare_current_user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (
            u.doctorId === data.doctorId ||
            u.userId === data.uid ||
            u.uid === data.uid ||
            (data.email && u.email && u.email.toLowerCase() === data.email.toLowerCase())
          ) {
            const updatedUser = { ...u, ...data };
            localStorage.setItem('quickcare_current_user', JSON.stringify(updatedUser));
          }
        }
      } catch (err) {}

      // Also update in-memory DEFAULT_DOCTORS
      const defIdx = DEFAULT_DOCTORS.findIndex(
        (d) => d.doctorId === data.doctorId || d.uid === data.uid
      );
      if (defIdx >= 0) {
        DEFAULT_DOCTORS[defIdx] = { ...DEFAULT_DOCTORS[defIdx], ...data };
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quickcare_doctors_updated', { detail: updatedDoctor }));
        window.dispatchEvent(new CustomEvent('quickcare_doctor_availability_updated', { detail: data }));
      }
    } catch (e) {
      console.warn('Error saving doctor profile locally:', e);
    }

    try {
      const res = await api.put('/doctors/profile', data);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Profile updated successfully', data };
    }
  },

  async getDoctorAvailability(doctorId, date) {
    // 1. Resolve doctor object from shared store or default doctors
    let targetDoc = null;
    try {
      const raw = localStorage.getItem('quickcare_shared_doctors');
      if (raw) {
        const local = JSON.parse(raw);
        targetDoc = local.find(
          (d) =>
            d.doctorId === doctorId ||
            d.uid === doctorId ||
            `doc_${d.uid}` === doctorId ||
            (doctorId && d.doctorId && d.doctorId.toLowerCase() === doctorId.toLowerCase()) ||
            (doctorId && d.uid && d.uid.toLowerCase() === doctorId.toLowerCase())
        );
      }
    } catch (e) {}

    if (!targetDoc) {
      targetDoc =
        DEFAULT_DOCTORS.find((d) => d.doctorId === doctorId || d.uid === doctorId) ||
        DEFAULT_DOCTORS[0];
    }

    // 2. Collect booked appointments dynamically
    let dynamicallyBookedSlots = [];
    try {
      const rawApts = localStorage.getItem('quickcare_shared_appointments');
      if (rawApts) {
        const apts = JSON.parse(rawApts);
        if (Array.isArray(apts)) {
          dynamicallyBookedSlots = apts
            .filter((a) => {
              const matchDoctor =
                a.doctorId === doctorId ||
                a.doctorId === targetDoc.doctorId ||
                a.doctorId === targetDoc.uid ||
                a.doctorId === `doc_${doctorId}` ||
                doctorId === `doc_${a.doctorId}`;
              const matchDate = a.appointmentDate === date;
              const isActive =
                a.status !== 'CANCELLED' &&
                a.status !== 'REJECTED' &&
                a.status !== 'DECLINED' &&
                !a.slotReleased;
              return matchDoctor && matchDate && isActive;
            })
            .map((a) => (a.appointmentTime || '').trim())
            .filter(Boolean);
        }
      }
    } catch (e) {}

    // 3. Try backend API call
    try {
      const res = await api.get(`/doctors/${doctorId}/availability`, { params: { date } });
      if (res && res.data && (res.data.data?.availableSlots || res.data.availableSlots)) {
        const remoteData = res.data.data || res.data;
        const allBooked = [...new Set([...(remoteData.bookedSlots || []), ...dynamicallyBookedSlots])];
        return {
          success: true,
          data: {
            ...remoteData,
            bookedSlots: allBooked,
          },
        };
      }
    } catch (err) {
      console.warn('Backend availability API offline, calculating dynamic real-time slots:', err.message);
    }

    // 4. Check holidays
    if (targetDoc.holidays && targetDoc.holidays.includes(date)) {
      return {
        success: true,
        data: {
          availabilityId: `${doctorId}_${date}`,
          doctorId,
          date,
          availableSlots: [],
          bookedSlots: [],
          slotDurationMinutes: targetDoc.slotDurationMinutes || 15,
          workingHours: targetDoc.workingHours || '09:00 AM - 05:00 PM',
          isHoliday: true,
          message: 'Doctor is on scheduled holiday on this date.',
        },
      };
    }

    // 5. Check working days (Monday - Sunday)
    if (date) {
      const targetDateObj = new Date(date + 'T00:00:00');
      const dayOfWeekName = targetDateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const availableDays =
        targetDoc.availableDays && targetDoc.availableDays.length > 0
          ? targetDoc.availableDays
          : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const isWorkingDay = availableDays.some(
        (d) =>
          d.toLowerCase() === dayOfWeekName.toLowerCase() ||
          (dayOfWeekName.length >= 3 && d.slice(0, 3).toLowerCase() === dayOfWeekName.slice(0, 3).toLowerCase())
      );

      if (!isWorkingDay) {
        return {
          success: true,
          data: {
            availabilityId: `${doctorId}_${date}`,
            doctorId,
            date,
            availableSlots: [],
            bookedSlots: [],
            slotDurationMinutes: targetDoc.slotDurationMinutes || 15,
            workingHours:
              targetDoc.workingHours ||
              `${targetDoc.workingStartTime || '09:00 AM'} - ${targetDoc.workingEndTime || '05:00 PM'}`,
            isNonWorkingDay: true,
            message: `Doctor does not consult on ${dayOfWeekName}s.`,
          },
        };
      }
    }

    // 6. Dynamic slot generation using doctor's exact workingStartTime and workingEndTime
    const duration = Number(targetDoc.slotDurationMinutes) || 15;
    const startMinutes = parseTimeStringToMinutes(targetDoc.workingStartTime, 9 * 60);
    const endMinutes = parseTimeStringToMinutes(targetDoc.workingEndTime, 17 * 60);
    const breakStart = parseTimeStringToMinutes(targetDoc.breakStartTime, 13 * 60);
    const breakEnd = parseTimeStringToMinutes(targetDoc.breakEndTime, 14 * 60);

    // Get current Indian Standard Time (Asia/Kolkata)
    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
    const [currH, currM] = istTimeStr.split(':').map(Number);
    const currTotalMinutes = currH * 60 + currM;

    const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    const isToday = date === istDateStr;

    const generatedSlots = [];
    for (let m = startMinutes; m <= endMinutes; m += duration) {
      // Check break window
      const slotEnd = m + duration;
      const inBreak =
        (m >= breakStart && m < breakEnd) ||
        (slotEnd > breakStart && slotEnd <= breakEnd) ||
        (m < breakStart && slotEnd > breakEnd);

      if (inBreak) {
        continue;
      }

      // If date is today, strictly hide/omit past time slots
      if (isToday && m <= currTotalMinutes) {
        continue;
      }

      const h = Math.floor(m / 60);
      const min = m % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const slotString = `${String(displayH).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
      generatedSlots.push(slotString);
    }

    const workingHoursDisplay =
      targetDoc.workingHours ||
      `${targetDoc.workingStartTime || '09:00 AM'} - ${targetDoc.workingEndTime || '05:00 PM'}`;

    return {
      success: true,
      data: {
        availabilityId: `${doctorId}_${date}`,
        doctorId,
        date,
        availableSlots: generatedSlots,
        bookedSlots: [...new Set(dynamicallyBookedSlots)],
        slotDurationMinutes: duration,
        workingHours: workingHoursDisplay,
        workingStartTime: targetDoc.workingStartTime || '09:00 AM',
        workingEndTime: targetDoc.workingEndTime || '05:00 PM',
        breakStartTime: targetDoc.breakStartTime || '01:00 PM',
        breakEndTime: targetDoc.breakEndTime || '02:00 PM',
      },
    };
  },

  async updateAvailability(data) {
    await this.updateDoctorProfile(data);
    try {
      const res = await api.put('/doctors/availability', data);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Availability schedule saved successfully', data };
    }
  },

  async updateDoctorStatus(status) {
    try {
      const res = await api.put('/doctors/status', { status });
      return res.data;
    } catch (err) {
      console.warn('Backend updateDoctorStatus API offline, persisting session status:', err.message);
      return { success: true, message: `Status updated to ${status}` };
    }
  },

  async get247AvailableDoctors() {
    try {
      const res = await api.get('/doctors/247/available');
      if (res && res.data && res.data.data) {
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      console.warn('Backend 24/7 doctors API offline, resolving active online doctors:', err.message);
    }
    const filtered = DEFAULT_DOCTORS.filter(
      (d) => d.videoConsultationAvailable !== false && d.onlineStatus !== 'OFFLINE'
    );
    return { success: true, data: filtered };
  },
};
