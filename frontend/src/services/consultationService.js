import api from './api';

export const consultationService = {
  async getByAppointment(appointmentId) {
    const res = await api.get(`/consultations/appointment/${appointmentId}`);
    return res.data;
  },

  async join(consultationId) {
    const res = await api.post(`/consultations/${consultationId}/join`);
    return res.data;
  },

  async end(consultationId) {
    const res = await api.put(`/consultations/${consultationId}/end`);
    return res.data;
  },
};
