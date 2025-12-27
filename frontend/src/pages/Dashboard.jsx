import { useState, useEffect } from 'react';
import { reportsService } from '../services/reports';
import { salesService } from '../services/sales';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate, getToday } from '../utils/date';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, format } from 'date-fns';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Month selector for daily sales chart
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dailySalesData, setDailySalesData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadDailySales();
  }, [selectedMonth]);

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

  const loadDailySales = async () => {
    setLoadingChart(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

      const salesData = await salesService.getAll({ start: startDate, end: endDate });

      // Group sales by date and calculate daily totals
      const dailyTotals = {};
      salesData.sales.forEach(sale => {
        // Skip ladydrink category (legacy data)
        if (sale.category === 'ladydrink') return;

        const date = sale.date;
        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        dailyTotals[date] += parseFloat(sale.amount);
      });

      // Convert to array format for chart
      const chartData = Object.entries(dailyTotals)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, total]) => ({
          date: format(new Date(date), 'dd MMM'),
          fullDate: date,
          sales: total
        }));

      setDailySalesData(chartData);
    } catch (err) {
      console.error('Failed to load daily sales:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
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

      {/* Daily Sales Chart */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Daily Sales</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="month-selector" style={{ fontWeight: 'normal', margin: 0 }}>Month:</label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingChart ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading chart...</div>
        ) : dailySalesData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No sales data for this month</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `฿${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [`฿${value.toLocaleString()}`, 'Sales']}
                  labelFormatter={(label) => {
                    const item = dailySalesData.find(d => d.date === label);
                    return item ? formatDisplayDate(item.fullDate) : label;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="sales"
                  fill="#4CAF50"
                  name="Daily Sales (฿)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary stats for selected month */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {formatCurrency(dailySalesData.reduce((sum, day) => sum + day.sales, 0))}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Sales</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  {formatCurrency(dailySalesData.length > 0 ? dailySalesData.reduce((sum, day) => sum + day.sales, 0) / dailySalesData.length : 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Daily Average</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                  {dailySalesData.length}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Days with Sales</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
