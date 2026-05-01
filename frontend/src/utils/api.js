import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('servify_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('servify_token');
      localStorage.removeItem('servify_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  registerUser: (data) => api.post('/auth/register/user', data),
  registerProvider: (data) => api.post('/auth/register/provider', data),
  loginUser: (data) => api.post('/auth/login/user', data),
  loginProvider: (data) => api.post('/auth/login/provider', data),
  loginAdmin: (data) => api.post('/auth/login/admin', data),
};

// Services
export const servicesAPI = {
  getCategories: () => api.get('/services/categories'),
  search: (params) => api.get('/services/search', { params }),
  getById: (id) => api.get(`/services/${id}`),
};

// Bookings
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  submitReview: (id, data) => api.post(`/bookings/${id}/review`, data),
};

// Provider
export const providerAPI = {
  getProfile: () => api.get('/provider/profile'),
  updateProfile: (data) => api.put('/provider/profile', data),
  getServices: () => api.get('/provider/services'),
  addService: (data) => api.post('/provider/services', data),
  updateService: (id, data) => api.put(`/provider/services/${id}`, data),
  deleteService: (id) => api.delete(`/provider/services/${id}`),
  getBookings: (params) => api.get('/provider/bookings', { params }),
  updateBookingStatus: (id, data) => api.put(`/provider/bookings/${id}/status`, data),
  getReviews: () => api.get('/provider/reviews'),
  getNotifications: () => api.get('/provider/notifications'),
  markNotificationsRead: () => api.put('/provider/notifications/read'),
};

// User
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getNotifications: () => api.get('/user/notifications'),
  markNotificationsRead: () => api.put('/user/notifications/read'),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getProviders: () => api.get('/admin/providers'),
  verifyProvider: (id) => api.put(`/admin/providers/${id}/verify`),
  toggleProvider: (id) => api.put(`/admin/providers/${id}/toggle`),
  getBookings: (params) => api.get('/admin/bookings', { params }),
};
