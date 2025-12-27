import api from './api';

export const salariesService = {
  // Get all salaries
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/salaries?${params}`);
    return response.data;
  },

  // Get salary by ID
  async getById(id) {
    const response = await api.get(`/salaries/${id}`);
    return response.data;
  },

  // Create salary
  async create(salaryData) {
    const response = await api.post('/salaries', salaryData);
    return response.data;
  },

  // Update salary
  async update(id, salaryData) {
    const response = await api.put(`/salaries/${id}`, salaryData);
    return response.data;
  },

  // Delete salary
  async delete(id) {
    const response = await api.delete(`/salaries/${id}`);
    return response.data;
  },

  // Get salaries summary
  async getSummary(startDate, endDate) {
    const response = await api.get('/salaries/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};
