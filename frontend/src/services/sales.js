import api from './api';

export const salesService = {
  // Get all sales
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/sales?${params}`);
    return response.data;
  },

  // Get sale by ID
  async getById(id) {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Create sale
  async create(saleData) {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  // Update sale
  async update(id, saleData) {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
  },

  // Delete sale
  async delete(id) {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },

  // Get sales summary
  async getSummary(startDate, endDate) {
    const response = await api.get('/sales/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};
