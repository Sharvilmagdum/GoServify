// ============================================================
// UPDATED App.js — Add these imports and routes
// ============================================================

// 1. ADD THESE IMPORTS at the top of your App.js:
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentPage from './pages/PaymentPage';

// 2. ADD THESE ROUTES inside your <Routes> in App.js:

// Forgot / Reset Password (public routes)
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />

// Payment page (user only)
<Route path="/payment/:bookingId" element={
  <PrivateRoute roles={['user']}>
    <PaymentPage />
  </PrivateRoute>
} />

// ============================================================
// 3. UPDATE your api.js — add payment APIs:
// ============================================================

export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  getKey: () => api.get('/payments/key'),
};

// ============================================================
// 4. UPDATE bookingsAPI in api.js — add getById:
// ============================================================
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),          // ADD THIS
  submitReview: (id, data) => api.post(`/bookings/${id}/review`, data),
};
