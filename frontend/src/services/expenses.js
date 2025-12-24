import api from './api';

export const expensesService = {
  // Get all expenses
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/expenses?${params}`);
    return response.data;
  },

  // Get expense by ID
  async getById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create expense
  async create(expenseData) {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Update expense
  async update(id, expenseData) {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  // Delete expense
  async delete(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  // Get expenses summary
  async getSummary(startDate, endDate) {
    const response = await api.get('/expenses/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};
