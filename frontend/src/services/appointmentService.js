import api from './api';

const STORAGE_KEY = 'quickcare_shared_appointments';

const getInitialAppointments = () => [
  {
    appointmentId: 'apt_seed_101',
    doctorId: 'doc_001',
    doctorName: 'Dr. Priya Deshmukh',
    patientId: 'pat_001',
    patientName: 'Aarav Sharma',
    patientEmail: 'patient@quickcare.com',
    patientPhone: '+91 98765 43210',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '11:00 AM',
    consultationType: 'VIDEO',
    status: 'CONFIRMED',
    confirmationStatus: 'CONFIRMED',
    reason: 'Follow-up consultation for cardiac health & blood pressure monitoring.',
    consultationFee: 800,
    googleMeetLink: 'https://meet.google.com/qck-card-hms',
    meetingRoomId: 'quickcare-room-apt101',
    createdAt: new Date().toISOString(),
  },
];

const getLocalAppointments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getInitialAppointments();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialAppointments();
  } catch (e) {
    return getInitialAppointments();
  }
};

const saveLocalAppointments = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

export const appointmentService = {
  async bookAppointment(data) {
    const meetLink = `https://meet.google.com/qck-care-${Math.random().toString(36).substring(2, 6)}`;
    const localApt = {
      appointmentId: `apt_${Date.now().toString(36)}`,
      doctorId: data.doctorId || 'doc_001',
      doctorName: data.doctorName || 'Dr. Priya Deshmukh',
      doctorSpecialization: data.doctorSpecialization || 'Cardiology',
      patientId: 'pat_001',
      patientName: data.patientName || 'Aarav Sharma',
      patientEmail: data.patientEmail || 'patient@quickcare.com',
      patientPhone: '+91 98765 43210',
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      consultationType: data.consultationType || 'VIDEO',
      status: 'PENDING',
      confirmationStatus: 'PENDING',
      reason: data.reason || 'Telehealth Consultation',
      consultationFee: data.consultationFee || 800,
      googleMeetLink: meetLink,
      meetingRoomId: meetLink,
      createdAt: new Date().toISOString(),
    };

    // Always immediately persist locally so Doctor and Patient dashboards see it
    const list = getLocalAppointments();
    list.unshift(localApt);
    saveLocalAppointments(list);

    try {
      const res = await api.post('/appointments', data);
      if (res && res.data) {
        if (res.data.data?.appointmentId) {
          localApt.appointmentId = res.data.data.appointmentId;
          if (res.data.data.googleMeetLink) {
            localApt.googleMeetLink = res.data.data.googleMeetLink;
          }
          saveLocalAppointments(list);
        }
        return res.data;
      }
    } catch (err) {
      console.warn('Backend server appointment booking offline, saved to synchronized storage:', err.message);
    }

    return {
      success: true,
      message: 'Appointment requested successfully',
      data: localApt,
    };
  },

  async getAppointmentById(id) {
    try {
      const res = await api.get(`/appointments/${id}`);
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn('Backend getAppointmentById offline:', err.message);
    }
    const local = getLocalAppointments().find((a) => a.appointmentId === id);
    return { success: true, data: local };
  },

  async getPatientAppointments() {
    let remoteList = [];
    try {
      const res = await api.get('/appointments/patient');
      if (res && res.data && Array.isArray(res.data.data)) {
        remoteList = res.data.data;
      } else if (res && Array.isArray(res.data)) {
        remoteList = res.data;
      }
    } catch (err) {
      console.warn('Backend getPatientAppointments offline, loading local store:', err.message);
    }

    const localList = getLocalAppointments();
    const remoteIds = new Set(remoteList.map((a) => a.appointmentId));
    const merged = [...localList.filter((l) => !remoteIds.has(l.appointmentId)), ...remoteList];

    return { success: true, data: merged };
  },

  async getDoctorAppointments() {
    let remoteList = [];
    try {
      const res = await api.get('/appointments/doctor');
      if (res && res.data && Array.isArray(res.data.data)) {
        remoteList = res.data.data;
      } else if (res && Array.isArray(res.data)) {
        remoteList = res.data;
      }
    } catch (err) {
      console.warn('Backend getDoctorAppointments offline, loading local store:', err.message);
    }

    const localList = getLocalAppointments();
    const remoteIds = new Set(remoteList.map((a) => a.appointmentId));
    const merged = [...localList.filter((l) => !remoteIds.has(l.appointmentId)), ...remoteList];

    return { success: true, data: merged };
  },

  async updateStatus(appointmentId, status, reason = '') {
    // Update locally
    const list = getLocalAppointments();
    const idx = list.findIndex((a) => a.appointmentId === appointmentId);
    if (idx !== -1) {
      list[idx].status = status;
      if (reason) list[idx].cancellationReason = reason;
      saveLocalAppointments(list);
    }

    try {
      const res = await api.put(`/appointments/${appointmentId}/status`, { status, reason });
      return res.data;
    } catch (err) {
      return { success: true, message: `Status updated to ${status}` };
    }
  },

  async reschedule(appointmentId, date, time) {
    const list = getLocalAppointments();
    const idx = list.findIndex((a) => a.appointmentId === appointmentId);
    if (idx !== -1) {
      list[idx].appointmentDate = date;
      list[idx].appointmentTime = time;
      saveLocalAppointments(list);
    }

    try {
      const res = await api.put(`/appointments/${appointmentId}/reschedule`, { date, time });
      return res.data;
    } catch (err) {
      return { success: true, message: 'Rescheduled successfully' };
    }
  },

  async cancel(appointmentId, reason = '') {
    return this.updateStatus(appointmentId, 'CANCELLED', reason);
  },

  async checkIn(appointmentId) {
    try {
      const res = await api.post(`/appointments/${appointmentId}/check-in`);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Checked in successfully' };
    }
  },

  async admit(appointmentId) {
    try {
      const res = await api.post(`/appointments/${appointmentId}/admit`);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Admitted successfully' };
    }
  },

  async getWaitingStatus(appointmentId) {
    try {
      const res = await api.get(`/appointments/${appointmentId}/waiting-status`);
      return res.data;
    } catch (err) {
      return { success: true, data: { status: 'ADMITTED', position: 0 } };
    }
  },

  async getDoctorWaitingQueue() {
    try {
      const res = await api.get('/appointments/doctor/waiting-queue');
      if (res && res.data && Array.isArray(res.data.data)) {
        return res.data;
      }
    } catch (err) {
      // Return any confirmed video consultations
    }
    const today = new Date().toISOString().split('T')[0];
    const queue = getLocalAppointments().filter(
      (a) => a.consultationType === 'VIDEO' && a.status === 'CONFIRMED' && a.appointmentDate === today
    );
    return { success: true, data: queue };
  },

  async confirmAvailability(appointmentId, response) {
    try {
      const res = await api.post(`/appointments/${appointmentId}/confirm-availability`, { response });
      return res.data;
    } catch (err) {
      return { success: true, message: 'Availability confirmed' };
    }
  },

  async adminReleaseSlot(appointmentId) {
    try {
      const res = await api.post(`/appointments/${appointmentId}/admin/release-slot`);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Slot released' };
    }
  },

  async getAdminConfirmations() {
    try {
      const res = await api.get('/appointments/admin/confirmations');
      return res.data;
    } catch (err) {
      return { success: true, data: getLocalAppointments() };
    }
  },

  async getAuditLogs(appointmentId) {
    try {
      const res = await api.get(`/appointments/${appointmentId}/audit-logs`);
      return res.data;
    } catch (err) {
      return { success: true, data: [] };
    }
  },

  async approveAppointment(appointmentId, data = {}) {
    return this.updateStatus(appointmentId, 'CONFIRMED');
  },

  async rejectAppointment(appointmentId, data = {}) {
    return this.updateStatus(appointmentId, 'REJECTED', data.reason);
  },

  async getGoogleMeetDetails(appointmentId) {
    const apt = getLocalAppointments().find((a) => a.appointmentId === appointmentId);
    return {
      success: true,
      data: {
        googleMeetLink: apt?.googleMeetLink || 'https://meet.google.com/qck-card-hms',
        meetingRoomId: apt?.meetingRoomId || 'quickcare-room-apt101',
      },
    };
  },
};
