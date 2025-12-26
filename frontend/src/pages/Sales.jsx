import { useState, useEffect } from 'react';
import { salesService } from '../services/sales';
import { formatCurrency, formatNumber } from '../utils/format';
import { formatDisplayDate, getToday, getThisMonth } from '../utils/date';

function Sales({ user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: getToday(),
    amount: '',
    paymentMethod: 'cash',
    category: 'drinks',
    notes: ''
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const period = getThisMonth();
      const data = await salesService.getAll(period);
      setSales(data.sales);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salesService.create(formData);
      setFormData({
        date: getToday(),
        amount: '',
        paymentMethod: 'cash',
        category: 'drinks',
        notes: ''
      });
      setShowForm(false);
      loadSales();
    } catch (err) {
      alert('Failed to create sale: ' + (err.response?.data?.error || err.message));
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sales</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Sale'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h3>New Sale</h3>
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
              <label>Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="drinks">Drinks</option>
                <option value="ladydrink">LadyDrink</option>
                <option value="barfine">Barfine</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <button type="submit" className="btn btn-primary">Save Sale</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Recent Sales</h3>
          <div className="stat-value success">{formatCurrency(totalSales)}</div>
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
                  <th>Payment</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No sales found</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{formatDisplayDate(sale.date)}</td>
                      <td className="success">{formatCurrency(sale.amount)}</td>
                      <td>{sale.payment_method}</td>
                      <td>{sale.category}</td>
                      <td>{sale.notes}</td>
                      <td>{sale.created_by_name}</td>
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

export default Sales;
