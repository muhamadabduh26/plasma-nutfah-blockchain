import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Automatically attach JWT token to headers if it exists in local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const PlasmaAPI = {
  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),

  // Dashboard
  stats: () => api.get('/dashboard/stats').then((r) => r.data),

  // User
  users: () => api.get('/users').then((r) => r.data),
  createUser: (data) => api.post('/users', data).then((r) => r.data),
  
  // Audit Blockchain
  transactions: () => api.get('/transactions').then((r) => r.data),

  // Tahap 1 — Registrasi
  register: (formData) =>
    api.post('/registrations', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  listRegistrations: () => api.get('/registrations').then((r) => r.data),
  getRegistration: (id) => api.get(`/registrations/${id}`).then((r) => r.data),
  cancelRegistration: (id) => api.post(`/registrations/${id}/cancel`).then((r) => r.data),
  history: (id) => api.get(`/registrations/${id}/history`).then((r) => r.data),

  // Tahap 2 — Verifikasi validator
  pending: () => api.get('/verifications/pending').then((r) => r.data),
  verifyAdmin: (id, payload) => api.post(`/registrations/${id}/verify-admin`, payload).then((r) => r.data),
  verifySubstantive: (id, payload) => api.post(`/registrations/${id}/verify-substantive`, payload).then((r) => r.data),

  // Tahap 3 — Sertifikat
  issueCertificate: (id) => api.post(`/registrations/${id}/issue-certificate`).then((r) => r.data),
  listCertificates: () => api.get('/certificates').then((r) => r.data),
  downloadUrl: (certId) => `/api/certificates/${certId}/download`,



  // Tahap 5 — Validasi publik
  verifyPublic: (formData) =>
    api.post('/verify-public', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};

export default api;
