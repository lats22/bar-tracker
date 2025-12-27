import api from './api';

export const ladiesService = {
  // Get all ladies
  async getAll(includeInactive = false) {
    const params = new URLSearchParams({ includeInactive: includeInactive.toString() });
    const response = await api.get(`/ladies?${params}`);
    return response.data;
  },

  // Get lady by ID
  async getById(id) {
    const response = await api.get(`/ladies/${id}`);
    return response.data;
  },

  // Create lady
  async create(ladyData) {
    const response = await api.post('/ladies', ladyData);
    return response.data;
  },

  // Update lady
  async update(id, ladyData) {
    const response = await api.put(`/ladies/${id}`, ladyData);
    return response.data;
  },

  // Deactivate lady
  async deactivate(id) {
    const response = await api.delete(`/ladies/${id}`);
    return response.data;
  },

  // Save lady drinks for a specific date
  async saveLadyDrinks(date, ladyDrinks) {
    const response = await api.post('/ladies/drinks', {
      date,
      ladyDrinks
    });
    return response.data;
  },

  // Get lady drinks for a specific date
  async getLadyDrinksByDate(date) {
    const response = await api.get(`/ladies/drinks/date/${date}`);
    return response.data;
  },

  // Get lady drinks summary for date range
  async getLadyDrinksSummary(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get(`/ladies/drinks/summary?${params}`);
    return response.data;
  },

  // Get lady drinks for date range
  async getLadyDrinksByDateRange(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get(`/ladies/drinks/range?${params}`);
    return response.data;
  }
};
