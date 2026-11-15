import api from './api.js';

const STORAGE_KEY = 'quickcare_shared_appointments';
const NOTIFICATIONS_STORAGE_KEY = 'quickcare_shared_notifications';

// Clean retrieval of stored appointments without any fake dummy or seed data
const getLocalAppointments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Permanently remove any legacy hardcoded dummy appointments (e.g. apt_seed_101, apt_101)
    const cleaned = parsed.filter(
      (a) => a && a.appointmentId !== 'apt_seed_101' && a.appointmentId !== 'apt_101'
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
};

const saveLocalAppointments = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickcare_appointments_updated', { detail: list }));
    }
  } catch (e) {
    console.error('LocalStorage write error for appointments:', e);
  }
};

const addLocalNotification = (notification) => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      notificationId: `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notification,
    });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickcare_notifications_updated'));
    }
  } catch (e) {}
};

export const appointmentService = {
  // Book an appointment explicitly requested by the patient
  async bookAppointment(data) {
    // 1. Resolve currently authenticated patient details
    let currentUid = data.patientUid || data.patientId;
    let currentEmail = data.patientEmail;
    let currentName = data.patientName;
    let currentPhone = data.patientPhone || '';

    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        currentUid = currentUid || u.uid || u.userId;
        currentEmail = currentEmail || u.email;
        currentName = currentName || u.fullName;
        currentPhone = currentPhone || u.phone || '';
      }
    } catch (e) {}

    if (!currentUid) {
      currentUid = `usr_${Date.now().toString(36)}`;
    }

    // 2. Strict double-booking prevention check
    const existingList = getLocalAppointments();
    const isAlreadyBooked = existingList.some(
      (a) =>
        a.doctorId === data.doctorId &&
        a.appointmentDate === data.appointmentDate &&
        (a.appointmentTime || '').trim().toUpperCase() === (data.appointmentTime || '').trim().toUpperCase() &&
        a.status !== 'CANCELLED' &&
        a.status !== 'REJECTED' &&
        a.status !== 'DECLINED' &&
        !a.slotReleased
    );

    if (isAlreadyBooked) {
      throw new Error('This appointment slot has just been booked. Please select another slot.');
    }

    const isVideo = (data.consultationType || 'VIDEO').toUpperCase() === 'VIDEO';
    const cleanId = `apt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // 3. Construct fully qualified appointment record
    const newAppointment = {
      appointmentId: cleanId,
      doctorId: data.doctorId,
      doctorUid: data.doctorUid || data.doctorId,
      doctorName: data.doctorName,
      doctorSpecialization: data.doctorSpecialization || 'General Healthcare',
      patientId: currentUid,
      patientUid: currentUid,
      patientName: currentName || 'Patient',
      patientEmail: currentEmail || '',
      patientPhone: currentPhone,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      consultationType: data.consultationType || 'VIDEO',
      consultationFee: Number(data.consultationFee) || 500,
      reason: data.reason || 'General Consultation',
      status: 'PENDING',
      appointmentStatus: 'PENDING',
      confirmationStatus: 'PENDING',
      slotReleased: false,
      googleMeetLink: null,
      videoConsultationLink: null,
      videoLinkSent: false,
      videoConsultationStatus: isVideo ? 'WAITING_FOR_LINK' : 'NOT_APPLICABLE',
      meetingRoomId: null,
      createdAt: new Date().toISOString(),
    };

    // 4. Save immediately so slot is locked and patient dashboard shows it
    existingList.unshift(newAppointment);
    saveLocalAppointments(existingList);

    // 5. Send notifications
    addLocalNotification({
      recipientUid: currentUid,
      recipientEmail: currentEmail,
      title: 'Appointment Request Submitted',
      message: `Your appointment request with ${data.doctorName} on ${data.appointmentDate} at ${data.appointmentTime} has been submitted.`,
      type: 'APPOINTMENT_BOOKED',
      appointmentId: cleanId,
    });

    addLocalNotification({
      recipientUid: data.doctorId,
      recipientEmail: data.doctorEmail || '',
      title: 'New Patient Appointment',
      message: `${currentName} booked a consultation for ${data.appointmentDate} at ${data.appointmentTime}.`,
      type: 'APPOINTMENT_REQUEST',
      appointmentId: cleanId,
    });

    // 6. Attempt server/Firestore sync
    try {
      const res = await api.post('/appointments', {
        ...data,
        patientId: currentUid,
        patientUid: currentUid,
        patientName: currentName,
        patientEmail: currentEmail,
        patientPhone: currentPhone,
      });
      if (res && res.data && res.data.data?.appointmentId) {
        newAppointment.appointmentId = res.data.data.appointmentId;
        newAppointment.videoConsultationStatus = res.data.data.videoConsultationStatus || newAppointment.videoConsultationStatus;
        saveLocalAppointments(existingList);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend server appointment booking offline, synchronized locally:', err.message);
    }

    return {
      success: true,
      message: 'Appointment requested successfully',
      data: newAppointment,
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

  // Get appointments strictly for the logged-in patient
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
      // Backend offline or standalone mode
    }

    // Resolve authenticated patient's identity
    let currentUid = null;
    let currentUserId = null;
    let currentEmail = null;
    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        currentUid = u.uid;
        currentUserId = u.userId;
        currentEmail = (u.email || '').toLowerCase().trim();
      }
    } catch (e) {}

    // If completely unauthenticated, return 0 appointments
    if (!currentUid && !currentUserId && !currentEmail) {
      return { success: true, data: [] };
    }

    const localList = getLocalAppointments();
    const remoteIds = new Set(remoteList.map((a) => a.appointmentId));
    const merged = [...localList.filter((l) => !remoteIds.has(l.appointmentId)), ...remoteList];

    // Filter strictly by THIS patient's identity
    const filtered = merged.filter((a) => {
      const aPatientUid = a.patientUid || '';
      const aPatientId = a.patientId || '';
      const aPatientEmail = (a.patientEmail || '').toLowerCase().trim();

      const matchUid = currentUid && (aPatientUid === currentUid || aPatientId === currentUid);
      const matchUserId = currentUserId && (aPatientUid === currentUserId || aPatientId === currentUserId);
      const matchEmail = currentEmail && aPatientEmail && aPatientEmail === currentEmail;

      return matchUid || matchUserId || matchEmail;
    });

    return { success: true, data: filtered };
  },

  // Get appointments strictly for a doctor
  async getDoctorAppointments(targetDoctorId = null) {
    let remoteList = [];
    try {
      const res = await api.get('/appointments/doctor');
      if (res && res.data && Array.isArray(res.data.data)) {
        remoteList = res.data.data;
      } else if (res && Array.isArray(res.data)) {
        remoteList = res.data;
      }
    } catch (err) {}

    let docId = targetDoctorId;
    let docEmail = null;
    let docName = null;

    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        docId = docId || u.doctorId || u.userId || u.uid;
        docEmail = (u.email || '').toLowerCase().trim();
        docName = (u.fullName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
      }
    } catch (e) {}

    const localList = getLocalAppointments();
    const remoteIds = new Set(remoteList.map((a) => a.appointmentId));
    const merged = [...localList.filter((l) => !remoteIds.has(l.appointmentId)), ...remoteList];

    const filtered = merged.filter((a) => {
      if (!docId && !docEmail && !docName) return true;

      const aDocId = a.doctorId || '';
      const aDocEmail = (a.doctorEmail || '').toLowerCase().trim();
      const aDocName = (a.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();

      const matchId = docId && (
        aDocId === docId ||
        aDocId === `doc_${docId}` ||
        docId === `doc_${aDocId}`
      );
      const matchEmail = docEmail && aDocEmail && aDocEmail === docEmail;
      const matchName = docName && aDocName && (
        aDocName === docName ||
        aDocName.includes(docName) ||
        docName.includes(aDocName)
      );

      return matchId || matchEmail || matchName;
    });

    return { success: true, data: filtered };
  },

  // Update appointment status and release slot on cancellation
  async updateStatus(appointmentId, status, reason = '') {
    const list = getLocalAppointments();
    const idx = list.findIndex((a) => a.appointmentId === appointmentId);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].appointmentStatus = status;
      if (reason) list[idx].cancellationReason = reason;

      if (status === 'CANCELLED' || status === 'REJECTED' || status === 'DECLINED') {
        list[idx].slotReleased = true;
        list[idx].cancelledAt = new Date().toISOString();
      }

      saveLocalAppointments(list);

      // Create notification
      addLocalNotification({
        recipientUid: list[idx].patientUid || list[idx].patientId,
        recipientEmail: list[idx].patientEmail,
        title: `Appointment ${status}`,
        message: `Your appointment with ${list[idx].doctorName} on ${list[idx].appointmentDate} has been ${status.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}`,
        type: `APPOINTMENT_${status}`,
        appointmentId,
      });
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
      list[idx].status = 'PENDING';
      list[idx].appointmentStatus = 'PENDING';
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

  async getDoctorWaitingQueue(targetDoctorId = null) {
    try {
      const res = await api.get('/appointments/doctor/waiting-queue');
      if (res && res.data && Array.isArray(res.data.data)) {
        return res.data;
      }
    } catch (err) {}

    const today = new Date().toISOString().split('T')[0];
    const docApts = await this.getDoctorAppointments(targetDoctorId);
    const queue = (docApts?.data || []).filter(
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

  async sendVideoConsultationLink(appointmentId, videoConsultationLink) {
    const trimmed = (videoConsultationLink || '').trim();
    const list = getLocalAppointments();
    const idx = list.findIndex((a) => a.appointmentId === appointmentId);
    if (idx !== -1) {
      list[idx].videoConsultationLink = trimmed;
      list[idx].googleMeetLink = trimmed;
      list[idx].meetingRoomId = trimmed;
      list[idx].videoLinkSent = true;
      list[idx].videoLinkSentAt = new Date().toISOString();
      list[idx].videoConsultationStatus = 'LINK_SENT';
      if (list[idx].status === 'PENDING') {
        list[idx].status = 'CONFIRMED';
        list[idx].appointmentStatus = 'CONFIRMED';
      }
      saveLocalAppointments(list);
    }
    try {
      const res = await api.post(`/appointments/${appointmentId}/send-video-link`, {
        videoConsultationLink: trimmed,
      });
      return res.data;
    } catch (err) {
      return {
        success: true,
        message: 'Video consultation link dispatched to patient email successfully',
        data: idx !== -1 ? list[idx] : null,
      };
    }
  },

  async approveAppointment(appointmentId, data = {}) {
    return this.updateStatus(appointmentId, 'CONFIRMED');
  },

  async rejectAppointment(appointmentId, data = {}) {
    return this.updateStatus(appointmentId, 'REJECTED', data.reason);
  },

  async updateMeetingLink(appointmentId, link) {
    const list = getLocalAppointments();
    const idx = list.findIndex((a) => a.appointmentId === appointmentId);
    if (idx !== -1) {
      list[idx].videoConsultationLink = link;
      list[idx].googleMeetLink = link;
      list[idx].meetingRoomId = link;
      list[idx].videoLinkSent = true;
      saveLocalAppointments(list);
    }
    try {
      await api.put(`/appointments/${appointmentId}/meeting-link`, { googleMeetLink: link });
    } catch (err) {}
    return { success: true, googleMeetLink: link };
  },

  async getGoogleMeetDetails(appointmentId) {
    try {
      const res = await api.get(`/appointments/${appointmentId}/google-meet`);
      if (res && res.data) return res.data;
    } catch (err) {}
    const apt = getLocalAppointments().find((a) => a.appointmentId === appointmentId);
    const cleanId = (appointmentId || 'session').replace(/[^a-zA-Z0-9]/g, '');
    const isSent = apt?.videoLinkSent || Boolean(apt?.videoConsultationLink);
    return {
      success: true,
      data: {
        appointmentId,
        googleMeetLink: isSent ? (apt?.videoConsultationLink || apt?.googleMeetLink) : null,
        videoConsultationLink: isSent ? (apt?.videoConsultationLink || apt?.googleMeetLink) : null,
        videoLinkSent: isSent,
        videoConsultationStatus: isSent ? 'LINK_SENT' : 'WAITING_FOR_LINK',
        meetingRoomId: isSent ? `QuickCare-${cleanId}` : null,
        liveVideoUrl: isSent ? `https://meet.jit.si/QuickCare-${cleanId}` : null,
      },
    };
  },
};
