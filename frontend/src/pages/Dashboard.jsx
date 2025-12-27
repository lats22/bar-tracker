import { useState, useEffect } from 'react';
import { reportsService } from '../services/reports';
import { salesService } from '../services/sales';
import { ladiesService } from '../services/ladies';
import { expensesService } from '../services/expenses';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate, getToday } from '../utils/date';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Month selector for daily sales chart
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dailySalesData, setDailySalesData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Lady drinks chart data
  const [ladyDrinksData, setLadyDrinksData] = useState([]);
  const [loadingLadyDrinks, setLoadingLadyDrinks] = useState(false);

  // Monthly expenses chart data
  const [monthlyExpensesData, setMonthlyExpensesData] = useState([]);
  const [loadingMonthlyExpenses, setLoadingMonthlyExpenses] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadMonthlyExpenses();
  }, []);

  useEffect(() => {
    loadDailySales();
    loadLadyDrinks();
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
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1);
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      // Add cache buster to force fresh data
      const salesData = await salesService.getAll({ startDate, endDate, _t: Date.now() });
      console.log('Sales data received:', salesData);
      console.log('Date range:', startDate, 'to', endDate);
      console.log('Number of sales records:', salesData.sales?.length || 0);

      // Group sales by date and calculate daily totals
      const dailyTotals = {};
      salesData.sales.forEach(sale => {
        // Skip ladydrink category (legacy data)
        if (sale.category === 'ladydrink') return;

        // Convert date to string format (YYYY-MM-DD)
        const date = typeof sale.date === 'string'
          ? sale.date.split('T')[0]
          : new Date(sale.date).toISOString().split('T')[0];

        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        dailyTotals[date] += parseFloat(sale.amount);
      });

      // Generate ALL days of the month
      const monthStartDate = startOfMonth(selectedDate);
      const monthEndDate = endOfMonth(selectedDate);
      const allDays = [];

      // Get number of days in the month
      const daysInMonth = monthEndDate.getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        allDays.push({
          date: format(currentDate, 'dd MMM'),
          fullDate: dateStr,
          dailySales: dailyTotals[dateStr] || 0
        });
      }

      // Add cumulative totals
      let cumulativeTotal = 0;
      const chartData = allDays.map(day => {
        cumulativeTotal += day.dailySales;
        return {
          ...day,
          sales: cumulativeTotal
        };
      });

      console.log('Daily totals:', dailyTotals);
      console.log('Chart data prepared:', chartData);
      console.log('Number of chart points:', chartData.length);
      setDailySalesData(chartData);
    } catch (err) {
      console.error('Failed to load daily sales:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  const loadLadyDrinks = async () => {
    setLoadingLadyDrinks(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1);
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

      // Add cache buster to force fresh data
      const response = await ladiesService.getLadyDrinksByDateRange(startDate, endDate);
      console.log('Lady drinks data received:', response);

      // Group by date and sum drink_count
      const dailyTotals = {};
      response.ladyDrinks.forEach(drink => {
        // Convert date to string format (YYYY-MM-DD)
        const date = typeof drink.date === 'string'
          ? drink.date.split('T')[0]
          : new Date(drink.date).toISOString().split('T')[0];

        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        dailyTotals[date] += parseInt(drink.drink_count);
      });

      // Generate ALL days of the month
      const monthStartDate = startOfMonth(selectedDate);
      const monthEndDate = endOfMonth(selectedDate);
      const chartData = [];

      // Get number of days in the month
      const daysInMonth = monthEndDate.getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        chartData.push({
          date: format(currentDate, 'dd MMM'),
          fullDate: dateStr,
          drinks: dailyTotals[dateStr] || 0
        });
      }

      console.log('Lady drinks chart data:', chartData);
      setLadyDrinksData(chartData);
    } catch (err) {
      console.error('Failed to load lady drinks:', err);
    } finally {
      setLoadingLadyDrinks(false);
    }
  };

  const loadMonthlyExpenses = async () => {
    setLoadingMonthlyExpenses(true);
    try {
      // Get expenses for the last 12 months
      const today = new Date();
      const startDate = format(subMonths(today, 11), 'yyyy-MM-01');
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

      const response = await expensesService.getAll({ startDate, endDate });
      console.log('Expenses data received:', response);

      // Group by month
      const monthlyTotals = {};
      response.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = format(date, 'yyyy-MM');

        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += parseFloat(expense.amount);
      });

      // Create array with all 12 months (even if no data)
      const chartData = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        chartData.push({
          month: format(monthDate, 'MMM yyyy'),
          monthKey: monthKey,
          expenses: monthlyTotals[monthKey] || 0
        });
      }

      console.log('Monthly expenses chart data:', chartData);
      setMonthlyExpensesData(chartData);
    } catch (err) {
      console.error('Failed to load monthly expenses:', err);
    } finally {
      setLoadingMonthlyExpenses(false);
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
  if (!data || !data.months) return null;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="text-muted">Today: {formatDisplayDate(getToday())}</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
        maxWidth: '1200px',
        margin: '0 auto 30px auto'
      }}>
        {data.months.map((month, index) => (
          <div key={index} className="stat-card">
            <h3>{month.name}</h3>
            <div className="stat-value success">{formatCurrency(month.sales || 0)}</div>
            <div className="stat-label">Sales</div>
            <div className="stat-value danger">{formatCurrency(month.expenses || 0)}</div>
            <div className="stat-label">Expenses</div>
            <div className="stat-value" style={{ color: '#FF9800' }}>{formatCurrency(month.salaries || 0)}</div>
            <div className="stat-label">Salaries</div>
            <div className="stat-value">{formatCurrency(month.profit || 0)}</div>
            <div className="stat-label">Profit</div>
          </div>
        ))}
      </div>

      {/* Cumulative Sales Chart */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h3>Cumulative Sales</h3>
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
          <div style={{ padding: '40px', textAlign: 'center' }}>No sales data for this period</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `฿${value.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: 'white',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                            {formatDisplayDate(data.fullDate)}
                          </p>
                          <p style={{ margin: '0', color: '#4CAF50' }}>
                            <strong>Cumulative Total:</strong> {formatCurrency(data.sales)}
                          </p>
                          <p style={{ margin: '0', color: '#666' }}>
                            <strong>Daily Sales:</strong> {formatCurrency(data.dailySales)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#4CAF50"
                  strokeWidth={3}
                  name="Cumulative Sales (฿)"
                  dot={{ fill: '#4CAF50', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
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
                  {formatCurrency(dailySalesData.length > 0 ? dailySalesData[dailySalesData.length - 1].sales : 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Sales</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  {formatCurrency(dailySalesData.reduce((sum, day) => sum + day.dailySales, 0) / dailySalesData.length)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Daily Average</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                  {dailySalesData.filter(day => day.dailySales > 0).length}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Days with Sales</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lady Drinks Chart */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h3>Daily Lady Drinks</h3>
        </div>

        {loadingLadyDrinks ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading chart...</div>
        ) : ladyDrinksData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No lady drinks data for this period</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={ladyDrinksData}>
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
                  label={{ value: 'Drinks', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: 'white',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                            {formatDisplayDate(data.fullDate)}
                          </p>
                          <p style={{ margin: '0', color: '#9C27B0' }}>
                            <strong>Lady Drinks:</strong> {data.drinks}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="drinks"
                  fill="#9C27B0"
                  name="Lady Drinks"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary stats for lady drinks */}
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
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {ladyDrinksData.reduce((sum, day) => sum + day.drinks, 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Monthly Total</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#673AB7' }}>
                  {ladyDrinksData.length > 0 ? Math.round(ladyDrinksData.reduce((sum, day) => sum + day.drinks, 0) / ladyDrinksData.length) : 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Daily Average</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#512DA8' }}>
                  {ladyDrinksData.length}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Days with Lady Drinks</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Expenses Chart */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h3>Monthly Expenses (Last 12 Months)</h3>
        </div>

        {loadingMonthlyExpenses ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading chart...</div>
        ) : monthlyExpensesData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No expenses data available</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyExpensesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: 'white',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                            {data.month}
                          </p>
                          <p style={{ margin: '0', color: '#f44336' }}>
                            <strong>Total Expenses:</strong> {formatCurrency(data.expenses)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="expenses"
                  fill="#f44336"
                  name="Monthly Expenses (฿)"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary stats for monthly expenses */}
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
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                  {formatCurrency(monthlyExpensesData.reduce((sum, month) => sum + month.expenses, 0))}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total (12 Months)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                  {formatCurrency(monthlyExpensesData.reduce((sum, month) => sum + month.expenses, 0) / 12)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Monthly Average</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>
                  {formatCurrency(Math.max(...monthlyExpensesData.map(m => m.expenses)))}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Highest Month</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
