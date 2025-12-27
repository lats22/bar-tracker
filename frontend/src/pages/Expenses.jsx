import { useState, useEffect } from 'react';
import { expensesService } from '../services/expenses';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate, getToday, getThisMonth } from '../utils/date';

function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: getToday(),
    amount: '',
    category: 'electricity',
    description: ''
  });

  const canManage = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const period = getThisMonth();
      const data = await expensesService.getAll(period);
      setExpenses(data.expenses);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({
      date: getToday(),
      amount: '',
      category: 'electricity',
      description: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await expensesService.update(editingId, formData);
        alert('Expense updated successfully!');
      } else {
        await expensesService.create(formData);
        alert('Expense created successfully!');
      }
      setFormData({
        date: getToday(),
        amount: '',
        category: 'electricity',
        description: ''
      });
      setEditingId(null);
      setShowForm(false);
      loadExpenses();
    } catch (err) {
      alert('Failed to save expense: ' + (err.response?.data?.error || err.message));
    }
  };

  // Group expenses by month
  const groupExpensesByMonth = () => {
    const groups = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) {
        groups[monthKey] = {
          expenses: [],
          total: 0,
          displayName: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        };
      }
      groups[monthKey].expenses.push(expense);
      groups[monthKey].total += parseFloat(expense.amount);
    });

    // Sort by month (newest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const monthlyGroups = groupExpensesByMonth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        {canManage && !showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                date: getToday(),
                amount: '',
                category: 'electricity',
                description: ''
              });
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            + Add Expense
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card mb-4">
          <h3>{editingId ? 'Edit Expense' : 'New Expense'}</h3>
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
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="electricity">Electricity</option>
                <option value="police">Police</option>
                <option value="water">Water</option>
                <option value="alcool">Alcool</option>
                <option value="juice">Juice</option>
                <option value="rent">Rent</option>
                <option value="general_fee">General Fee</option>
                <option value="wifi">Wifi</option>
                <option value="ice_supply">Ice supply</option>
                <option value="snacks">Snacks</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Expense description"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Expense' : 'Save Expense'}
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
      ) : expenses.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', padding: '20px' }}>No expenses found</p>
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
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>By</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthData.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDisplayDate(expense.date)}</td>
                      <td className="danger">{formatCurrency(expense.amount)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{expense.category.replace('_', ' ')}</td>
                      <td>{expense.description}</td>
                      <td>{expense.created_by_name}</td>
                      {canManage && (
                        <td>
                          <button
                            onClick={() => handleEdit(expense)}
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

export default Expenses;
