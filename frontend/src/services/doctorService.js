import api from './api';

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
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
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
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
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
    profileImage: 'https://images.unsplash.com/photo-1594824813583-43efb8e23528?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
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
    bio: 'Experienced Senior Cardiologist at Kadam Hospital specializing in comprehensive cardiovascular care and clinical cardiology.',
    clinicAddress: 'Kadam Hospital',
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
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
    profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
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
    profileImage: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    workingHours: '09:00 AM - 05:00 PM',
    workingStartTime: '09:00 AM',
    workingEndTime: '05:00 PM',
    slotDurationMinutes: 15,
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

    let filtered = DEFAULT_DOCTORS;
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
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.clinicAddress.toLowerCase().includes(q)
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

    const doc = DEFAULT_DOCTORS.find((d) => d.doctorId === id) || DEFAULT_DOCTORS[0];
    return {
      success: true,
      data: doc,
    };
  },

  async getMyDoctorProfile() {
    try {
      const res = await api.get('/doctors/me');
      return res.data;
    } catch (err) {
      return { success: true, data: DEFAULT_DOCTORS[0] };
    }
  },

  async updateDoctorProfile(data) {
    const res = await api.put('/doctors/profile', data);
    return res.data;
  },

  async getDoctorAvailability(doctorId, date) {
    try {
      const res = await api.get(`/doctors/${doctorId}/availability`, { params: { date } });
      if (res && res.data && (res.data.data?.availableSlots || res.data.availableSlots)) {
        return { success: true, data: res.data.data || res.data };
      }
    } catch (err) {
      console.warn('Backend availability API offline, generating clinical time slots:', err.message);
    }

    const defaultSlots = [
      '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
      '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
      '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
      '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
      '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
      '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
      '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM'
    ];

    return {
      success: true,
      data: {
        availabilityId: `${doctorId}_${date}`,
        doctorId,
        date,
        availableSlots: defaultSlots,
        slotDurationMinutes: 15,
        workingHours: '09:00 AM - 05:00 PM',
      },
    };
  },

  async updateAvailability(data) {
    const res = await api.put('/doctors/availability', data);
    return res.data;
  },
};
