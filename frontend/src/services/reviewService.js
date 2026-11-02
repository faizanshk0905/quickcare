import api from './api';

export const reviewService = {
  submitReview: async (appointmentId, rating, feedback) => {
    const res = await api.post('/api/reviews', {
      appointmentId,
      rating,
      feedback,
    });
    return res.data;
  },

  getDoctorReviews: async (doctorId) => {
    const res = await api.get(`/api/reviews/doctor/${doctorId}`);
    return res.data;
  },

  getDoctorRatingSummary: async (doctorId) => {
    const res = await api.get(`/api/reviews/doctor/${doctorId}/summary`);
    return res.data;
  },

  getMyReviews: async () => {
    const res = await api.get('/api/reviews/my');
    return res.data;
  },

  deleteReview: async (reviewId) => {
    const res = await api.delete(`/api/reviews/${reviewId}`);
    return res.data;
  },
};

export default reviewService;
