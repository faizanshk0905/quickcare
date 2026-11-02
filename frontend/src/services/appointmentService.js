import api from './api';

export const appointmentService = {
  async bookAppointment(data) {
    const res = await api.post('/appointments', data);
    return res.data;
  },

  async getAppointmentById(id) {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },

  async getPatientAppointments() {
    const res = await api.get('/appointments/patient');
    return res.data;
  },

  async getDoctorAppointments() {
    const res = await api.get('/appointments/doctor');
    return res.data;
  },

  async updateStatus(appointmentId, status, reason = '') {
    const res = await api.put(`/appointments/${appointmentId}/status`, { status, reason });
    return res.data;
  },

  async reschedule(appointmentId, date, time) {
    const res = await api.put(`/appointments/${appointmentId}/reschedule`, { date, time });
    return res.data;
  },

  async cancel(appointmentId, reason = '') {
    const res = await api.delete(`/appointments/${appointmentId}`, { params: { reason } });
    return res.data;
  },
};
