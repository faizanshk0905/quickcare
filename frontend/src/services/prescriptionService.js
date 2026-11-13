import api from './api';

const PRESCRIPTIONS_KEY = 'quickcare_shared_prescriptions';

const getLocalPrescriptions = () => {
  try {
    const raw = localStorage.getItem(PRESCRIPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalPrescriptions = (list) => {
  try {
    localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(list));
  } catch (e) {}
};

export const prescriptionService = {
  async createPrescription(data) {
    const localRx = {
      prescriptionId: `rx_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const list = getLocalPrescriptions();
    list.unshift(localRx);
    saveLocalPrescriptions(list);

    try {
      const res = await api.post('/prescriptions', data);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Prescription saved successfully', data: localRx };
    }
  },

  async getPrescriptionById(id) {
    try {
      const res = await api.get(`/prescriptions/${id}`);
      if (res && res.data) return res.data;
    } catch (err) {}
    const list = getLocalPrescriptions();
    const found = list.find((p) => p.prescriptionId === id);
    return { success: true, data: found };
  },

  async getPatientPrescriptions() {
    try {
      const res = await api.get('/prescriptions/patient');
      if (res && res.data && Array.isArray(res.data.data || res.data)) {
        return res.data;
      }
    } catch (err) {}

    let patEmail = null;
    let patId = null;
    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        patEmail = (u.email || '').toLowerCase().trim();
        patId = u.userId || u.uid;
      }
    } catch (e) {}

    const list = getLocalPrescriptions().filter(
      (p) => (!patEmail && !patId) || p.patientEmail?.toLowerCase().trim() === patEmail || p.patientId === patId
    );
    return { success: true, data: list };
  },

  async getDoctorPrescriptions() {
    try {
      const res = await api.get('/prescriptions/doctor');
      if (res && res.data && Array.isArray(res.data.data || res.data)) {
        return res.data;
      }
    } catch (err) {}

    let docId = null;
    let docName = null;
    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        docId = u.doctorId || u.userId || u.uid;
        docName = (u.fullName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
      }
    } catch (e) {}

    const list = getLocalPrescriptions().filter((p) => {
      if (!docId && !docName) return true;
      const matchId = docId && (p.doctorId === docId || p.doctorId === `doc_${docId}`);
      const rxDocName = (p.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
      const matchName = docName && rxDocName && (rxDocName.includes(docName) || docName.includes(rxDocName));
      return matchId || matchName;
    });

    return { success: true, data: list };
  },
};
