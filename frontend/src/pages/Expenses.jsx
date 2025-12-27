import { useState, useEffect } from 'react';
import { expensesService } from '../services/expenses';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate, getToday, getThisMonth } from '../utils/date';

function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: getToday(),
    amount: '',
    category: 'electricity',
    vendor: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expensesService.create(formData);
      setFormData({
        date: getToday(),
        amount: '',
        category: 'electricity',
        vendor: '',
        description: ''
      });
      setShowForm(false);
      loadExpenses();
    } catch (err) {
      alert('Failed to create expense: ' + (err.response?.data?.error || err.message));
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card mb-4">
          <h3>New Expense</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
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
              </select>
            </div>
            <div className="form-group">
              <label>Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Vendor name"
              />
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
            <button type="submit" className="btn btn-primary">Save Expense</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Recent Expenses</h3>
          <div className="stat-value danger">{formatCurrency(totalExpenses)}</div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Description</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No expenses found</td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDisplayDate(expense.date)}</td>
                      <td className="danger">{formatCurrency(expense.amount)}</td>
                      <td>{expense.category}</td>
                      <td>{expense.vendor}</td>
                      <td>{expense.description}</td>
                      <td>{expense.created_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;
