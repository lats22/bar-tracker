import { useState, useEffect } from 'react';
import { reportsService } from '../services/reports';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate, getToday } from '../utils/date';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await reportsService.getDashboard();
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="text-muted">Today: {formatDisplayDate(getToday())}</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today</h3>
          <div className="stat-value success">{formatCurrency(data.today.sales)}</div>
          <div className="stat-label">Sales</div>
          <div className="stat-value danger">{formatCurrency(data.today.expenses)}</div>
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatCurrency(data.today.profit)}</div>
          <div className="stat-label">Profit</div>
        </div>

        <div className="stat-card">
          <h3>This Week</h3>
          <div className="stat-value success">{formatCurrency(data.thisWeek.sales)}</div>
          <div className="stat-label">Sales</div>
          <div className="stat-value danger">{formatCurrency(data.thisWeek.expenses)}</div>
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatCurrency(data.thisWeek.profit)}</div>
          <div className="stat-label">Profit</div>
        </div>

        <div className="stat-card">
          <h3>This Month</h3>
          <div className="stat-value success">{formatCurrency(data.thisMonth.sales)}</div>
          <div className="stat-label">Sales</div>
          <div className="stat-value danger">{formatCurrency(data.thisMonth.expenses)}</div>
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatCurrency(data.thisMonth.profit)}</div>
          <div className="stat-label">Profit</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
