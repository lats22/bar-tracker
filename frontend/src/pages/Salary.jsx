import { useState, useEffect } from 'react';
import { employeesService } from '../services/employees';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate, getToday, getThisMonth } from '../utils/date';

function Salary({ user }) {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showNewEmployeeForm, setShowNewEmployeeForm] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [formData, setFormData] = useState({
    date: getToday(),
    amount: '',
    employeeId: '',
    position: 'bartender',
    notes: ''
  });

  const canManage = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    loadEmployees();
    // loadSalaries();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeesService.getAll();
      setEmployees(data.employees);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      // TODO: Implement salary service
      // const period = getThisMonth();
      // const data = await salaryService.getAll(period);
      // setSalaries(data.salaries);
      setSalaries([]);
    } catch (err) {
      console.error('Failed to load salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewEmployee = async () => {
    if (!newEmployeeName.trim()) {
      alert('Please enter an employee name');
      return;
    }

    try {
      const response = await employeesService.create({
        name: newEmployeeName.trim(),
        position: formData.position
      });

      // Reload employees list
      await loadEmployees();

      // Select the newly created employee
      setFormData({ ...formData, employeeId: response.employee.id });

      // Close the new employee form
      setShowNewEmployeeForm(false);
      setNewEmployeeName('');

      alert('Employee added successfully!');
    } catch (err) {
      alert('Failed to add employee: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (salary) => {
    setFormData({
      date: salary.date,
      amount: salary.amount,
      employeeId: salary.employee_id,
      position: salary.position,
      notes: salary.notes || ''
    });
    setEditingId(salary.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({
      date: getToday(),
      amount: '',
      employeeId: '',
      position: 'bartender',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
    setShowNewEmployeeForm(false);
    setNewEmployeeName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // await salaryService.update(editingId, formData);
        alert('Salary updated successfully!');
      } else {
        // await salaryService.create(formData);
        alert('Salary created successfully!');
      }
      setFormData({
        date: getToday(),
        amount: '',
        employeeId: '',
        position: 'bartender',
        notes: ''
      });
      setEditingId(null);
      setShowForm(false);
      setShowNewEmployeeForm(false);
      setNewEmployeeName('');
      loadSalaries();
    } catch (err) {
      alert('Failed to save salary: ' + (err.response?.data?.error || err.message));
    }
  };

  // Group salaries by month
  const groupSalariesByMonth = () => {
    const groups = {};
    salaries.forEach(salary => {
      const date = new Date(salary.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) {
        groups[monthKey] = {
          salaries: [],
          total: 0,
          displayName: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        };
      }
      groups[monthKey].salaries.push(salary);
      groups[monthKey].total += parseFloat(salary.amount);
    });

    // Sort by month (newest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const monthlyGroups = groupSalariesByMonth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Salary</h1>
        {canManage && !showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                date: getToday(),
                amount: '',
                employeeId: '',
                position: 'bartender',
                notes: ''
              });
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            + Add Salary
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card mb-4">
          <h3>{editingId ? 'Edit Salary' : 'New Salary'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={!!editingId}
              />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Employee</label>
              <select
                value={formData.employeeId}
                onChange={(e) => {
                  if (e.target.value === 'add_new') {
                    setShowNewEmployeeForm(true);
                    setFormData({ ...formData, employeeId: '', position: 'bartender' });
                  } else {
                    // Find selected employee and auto-fill position
                    const selectedEmployee = employees.find(emp => emp.id === e.target.value);
                    setFormData({
                      ...formData,
                      employeeId: e.target.value,
                      position: selectedEmployee ? selectedEmployee.position : 'bartender'
                    });
                    setShowNewEmployeeForm(false);
                  }
                }}
                required
                disabled={!!editingId}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
                <option value="add_new">+ Add New Employee</option>
              </select>
            </div>
            {showNewEmployeeForm && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>New Employee Name</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="Enter employee name"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewEmployee}
                    className="btn"
                    style={{ backgroundColor: '#4CAF50', color: 'white', padding: '8px 16px' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewEmployeeForm(false);
                      setNewEmployeeName('');
                      setFormData({ ...formData, employeeId: '' });
                    }}
                    className="btn"
                    style={{ backgroundColor: '#666', color: 'white', padding: '8px 16px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
                disabled={formData.employeeId && !showNewEmployeeForm}
              >
                <option value="bartender">Bartender</option>
                <option value="waitress">Waitress</option>
                <option value="manager">Manager</option>
                <option value="security">Security</option>
                <option value="cleaner">Cleaner</option>
                <option value="cook">Cook</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Salary' : 'Save Salary'}
              </button>
              <button type="button" onClick={handleCancel} className="btn" style={{ backgroundColor: '#666', color: 'white' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card">
          <p>Loading...</p>
        </div>
      ) : salaries.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', padding: '20px' }}>No salary records found</p>
        </div>
      ) : (
        monthlyGroups.map(([monthKey, monthData]) => (
          <div key={monthKey} className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3>{monthData.displayName}</h3>
              <div className="stat-value danger">{formatCurrency(monthData.total)}</div>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee Name</th>
                    <th>Position</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>By</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthData.salaries.map((salary) => (
                    <tr key={salary.id}>
                      <td>{formatDisplayDate(salary.date)}</td>
                      <td>{salary.employee_name || salary.employeeName}</td>
                      <td style={{ textTransform: 'capitalize' }}>{salary.position}</td>
                      <td className="danger">{formatCurrency(salary.amount)}</td>
                      <td>{salary.notes}</td>
                      <td>{salary.created_by_name}</td>
                      {canManage && (
                        <td>
                          <button
                            onClick={() => handleEdit(salary)}
                            className="btn"
                            style={{
                              padding: '5px 15px',
                              fontSize: '14px',
                              backgroundColor: '#2196F3',
                              color: 'white'
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Salary;
