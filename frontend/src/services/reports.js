import api from './api';

export const reportsService = {
  // Get dashboard data
  async getDashboard() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Get financial report
  async getFinancialReport(startDate, endDate) {
    const response = await api.get('/reports/financial', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get activity logs (admin only)
  async getActivityLogs(limit = 50, offset = 0) {
    const response = await api.get('/reports/activity-logs', {
      params: { limit, offset }
    });
    return response.data;
  }
};
