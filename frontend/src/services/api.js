import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // Never send Authorization header to public auth endpoints
    const isPublicAuth = config.url && (
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/forgot-password')
    );

    const token = localStorage.getItem('quickcare_token');
    if (token && !isPublicAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isPublicAuth) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const currentToken = localStorage.getItem('quickcare_token');
      // Do not clear if using active demo session
      if (currentToken && !currentToken.startsWith('demo-token-') &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        console.warn('Session expired or unauthorized. Clearing stored token.');
        localStorage.removeItem('quickcare_token');
        localStorage.removeItem('quickcare_role');
        localStorage.removeItem('quickcare_profile_id');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
