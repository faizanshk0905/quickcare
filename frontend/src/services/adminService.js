import api from './api';

export const adminService = {
  async getDashboardStats() {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  async getAllDoctors() {
    const res = await api.get('/admin/doctors');
    return res.data;
  },

  async getAllPatients() {
    const res = await api.get('/admin/patients');
    return res.data;
  },

  async getAllAppointments() {
    const res = await api.get('/admin/appointments');
    return res.data;
  },

  async verifyDoctor(doctorId, approve, feedback = '') {
    const res = await api.put(`/admin/doctors/${doctorId}/verify`, { approve, feedback });
    return res.data;
  },

  async updateUserStatus(userId, status) {
    const res = await api.put(`/admin/users/${userId}/status`, { status });
    return res.data;
  },
};
