import api from './axios.js';

export const dashboardApi = {
  getSummary: (filters = {}) =>
    api.get('/dashboard/summary', { params: filters }).then((r) => r.data),
  getExpensesByCategory: (filters = {}) =>
    api.get('/dashboard/expenses-by-category', { params: filters }).then((r) => r.data),
  getMonthly: (months = 6) =>
    api.get('/dashboard/monthly', { params: { months } }).then((r) => r.data),
};
