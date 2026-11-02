import api from './api';

export const prescriptionService = {
  async createPrescription(data) {
    const res = await api.post('/prescriptions', data);
    return res.data;
  },

  async getPrescriptionById(id) {
    const res = await api.get(`/prescriptions/${id}`);
    return res.data;
  },

  async getPatientPrescriptions() {
    const res = await api.get('/prescriptions/patient');
    return res.data;
  },

  async getDoctorPrescriptions() {
    const res = await api.get('/prescriptions/doctor');
    return res.data;
  },
};
