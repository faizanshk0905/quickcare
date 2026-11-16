import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async forgotPassword(email, newPassword) {
    const res = await api.post('/auth/forgot-password', { email, newPassword });
    return res.data;
  },

  // Requirement 1: OTP Email Verification APIs
  async sendOtp({ email, role = 'PATIENT', fullName = '' }) {
    const res = await api.post('/auth/otp/send', { email, role, fullName });
    return res.data;
  },

  async verifyOtp({ email, otp }) {
    const res = await api.post('/auth/otp/verify', { email, otp });
    return res.data;
  },

  async resendOtp({ email, role = 'PATIENT', fullName = '' }) {
    const res = await api.post('/auth/otp/resend', { email, role, fullName });
    return res.data;
  },

  // Requirement 3: Qualification Certificate Upload APIs
  async uploadCertificate(file, doctorUid) {
    const formData = new FormData();
    formData.append('file', file);
    if (doctorUid) {
      formData.append('doctorUid', doctorUid);
    }
    const res = await api.post('/auth/upload-certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async uploadCertificateBase64({ data, fileName, contentType, doctorUid }) {
    const res = await api.post('/auth/upload-certificate', {
      data,
      fileName,
      contentType,
      doctorUid,
    });
    return res.data;
  },
};
