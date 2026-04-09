import api from './axios.js';

export const transactionApi = {
  getAll: (filters = {}) =>
    api.get('/transactions', { params: filters }).then((r) => r.data),
  create: (data) => api.post('/transactions', data).then((r) => r.data),
  update: (id, data) => api.put(`/transactions/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
