import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

function Users({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'staff'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

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

    if (editingUser) {
      // Update existing user
      try {
        const updateData = {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role
        };

        // Only include password if it's provided
        if (formData.password) {
          if (formData.password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
          }
          updateData.password = formData.password;
        }

        await authService.updateUser(editingUser.id, updateData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
        setFormData({
          username: '',
          email: '',
          password: '',
          fullName: '',
          role: 'staff'
        });
        setEditingUser(null);
        setShowForm(false);
        fetchUsers();
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to update user'
        });
      }
    } else {
      // Create new user
      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        return;
      }

      try {
        await authService.register(formData);
        setMessage({ type: 'success', text: 'User created successfully!' });
        setFormData({
          username: '',
          email: '',
          password: '',
          fullName: '',
          role: 'staff'
        });
        setShowForm(false);
        fetchUsers();
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to create user'
        });
      }
    }
  };

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      password: '', // Don't pre-fill password
      fullName: userToEdit.full_name,
      role: userToEdit.role
    });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'staff'
    });
    setShowForm(false);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (userId, username) => {
    if (userId === user.id) {
      setMessage({ type: 'error', text: 'You cannot delete your own account' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await authService.deleteUser(userId);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      fetchUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to delete user'
      });
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge badge-danger';
      case 'manager':
        return 'badge badge-warning';
      case 'staff':
        return 'badge badge-info';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancel' : '+ Create New User'}
        </button>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!editingUser}
                  disabled={editingUser}
                  className="form-control"
                  minLength="3"
                  maxLength="50"
                />
                {editingUser && <small>Username cannot be changed</small>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Password {editingUser ? '' : '*'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingUser}
                className="form-control"
                minLength="6"
              />
              <small>{editingUser ? 'Leave blank to keep current password' : 'Minimum 6 characters'}</small>
            </div>

            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>All Users ({users.length})</h2>

        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.username}</strong>
                      {u.id === user.id && <span style={{ marginLeft: '8px', color: '#666' }}>(You)</span>}
                    </td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={getRoleBadgeClass(u.role)}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(u)}
                        className="btn btn-sm btn-primary"
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
