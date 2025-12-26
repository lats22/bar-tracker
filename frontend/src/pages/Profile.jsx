import { useState } from 'react';
import { authService } from '../services/auth';

function Profile({ user }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to change password'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile Settings</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h2>User Information</h2>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={user.username} disabled className="form-control" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="text" value={user.email} disabled className="form-control" />
        </div>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={user.fullName} disabled className="form-control" />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input type="text" value={user.role.toUpperCase()} disabled className="form-control" />
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginTop: '20px' }}>
        <h2>Change Password</h2>

        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password *</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="form-control"
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label>New Password *</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="form-control"
              autoComplete="new-password"
            />
            <small>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label>Confirm New Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-control"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
