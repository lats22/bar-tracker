import api from './api';

export const authService = {
  // Login
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get user profile
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Get all users (admin/manager)
  async getAllUsers() {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Register new user (admin only)
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }
};
