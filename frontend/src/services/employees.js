import api from './api';

export const employeesService = {
  // Get all employees
  async getAll(includeInactive = false) {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await api.get(`/employees${params}`);
    return response.data;
  },

  // Get employee by ID
  async getById(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // Create employee
  async create(employeeData) {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  // Update employee
  async update(id, employeeData) {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  // Deactivate employee
  async deactivate(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};
