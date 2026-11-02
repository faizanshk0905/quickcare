import api from './api';

export const doctorService = {
  async searchDoctors(params = {}) {
    const res = await api.get('/doctors', { params });
    return res.data;
  },

  async getDoctorById(id) {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },

  async getMyDoctorProfile() {
    const res = await api.get('/doctors/me');
    return res.data;
  },

  async updateDoctorProfile(data) {
    const res = await api.put('/doctors/profile', data);
    return res.data;
  },

  async getDoctorAvailability(doctorId, date) {
    const res = await api.get(`/doctors/${doctorId}/availability`, { params: { date } });
    return res.data;
  },

  async updateAvailability(data) {
    const res = await api.put('/doctors/availability', data);
    return res.data;
  },
};
