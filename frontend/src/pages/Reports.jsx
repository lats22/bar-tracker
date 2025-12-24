import { useState, useEffect } from 'react';
import { reportsService } from '../services/reports';
import { formatCurrency, formatPercent } from '../utils/format';
import { formatDate, getThisMonth, getLast30Days, getThisYear } from '../utils/date';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

function Reports() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const dates = getPeriodDates(period);
      const reportData = await reportsService.getFinancialReport(dates.start, dates.end);
      setData(reportData);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = (p) => {
    switch (p) {
      case 'month':
        return getThisMonth();
      case '30days':
        return getLast30Days();
      case 'year':
        return getThisYear();
      default:
        return getThisMonth();
    }
  };

  if (loading) return <div className="loading">Loading report...</div>;
  if (!data) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Financial Reports</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="select">
          <option value="month">This Month</option>
          <option value="30days">Last 30 Days</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value success">{formatCurrency(data.financials.totalSales)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value danger">{formatCurrency(data.financials.totalExpenses)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Profit</div>
          <div className="stat-value">{formatCurrency(data.financials.netProfit)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Profit Margin</div>
          <div className="stat-value">{formatPercent(data.financials.profitMargin)}</div>
        </div>
      </div>

      <div className="card">
        <h3>Daily Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#10b981" name="Sales" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Sales by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.sales.byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                {data.sales.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.expenses.byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Reports;
