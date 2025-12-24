const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const pool = require('../config/database');

// Get comprehensive financial report
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get sales data
    const salesSummary = await Sale.getSummary(startDate, endDate);
    const salesByCategory = await Sale.getByCategory(startDate, endDate);
    const dailySales = await Sale.getDailySales(startDate, endDate);

    // Get expenses data
    const expensesSummary = await Expense.getSummary(startDate, endDate);
    const expensesByCategory = await Expense.getByCategory(startDate, endDate);
    const dailyExpenses = await Expense.getDailyExpenses(startDate, endDate);

    // Calculate profit/loss
    const totalSales = parseFloat(salesSummary.total_sales || 0);
    const totalExpenses = parseFloat(expensesSummary.total_expenses || 0);
    const netProfit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Combine daily data
    const dailyData = combineDailyData(dailySales, dailyExpenses);

    res.json({
      period: { startDate, endDate },
      sales: {
        summary: salesSummary,
        byCategory: salesByCategory,
        daily: dailySales
      },
      expenses: {
        summary: expensesSummary,
        byCategory: expensesByCategory,
        daily: dailyExpenses
      },
      financials: {
        totalSales,
        totalExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2)
      },
      dailyData
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
};

// Get dashboard statistics
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's stats
    const todaySales = await Sale.getSummary(today, today);
    const todayExpenses = await Expense.getSummary(today, today);

    // This week's stats
    const weekSales = await Sale.getSummary(weekAgo, today);
    const weekExpenses = await Expense.getSummary(weekAgo, today);

    // This month's stats
    const monthSales = await Sale.getSummary(monthAgo, today);
    const monthExpenses = await Expense.getSummary(monthAgo, today);

    res.json({
      today: {
        sales: parseFloat(todaySales.total_sales || 0),
        expenses: parseFloat(todayExpenses.total_expenses || 0),
        profit: parseFloat(todaySales.total_sales || 0) - parseFloat(todayExpenses.total_expenses || 0)
      },
      thisWeek: {
        sales: parseFloat(weekSales.total_sales || 0),
        expenses: parseFloat(weekExpenses.total_expenses || 0),
        profit: parseFloat(weekSales.total_sales || 0) - parseFloat(weekExpenses.total_expenses || 0)
      },
      thisMonth: {
        sales: parseFloat(monthSales.total_sales || 0),
        expenses: parseFloat(monthExpenses.total_expenses || 0),
        profit: parseFloat(monthSales.total_sales || 0) - parseFloat(monthExpenses.total_expenses || 0)
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

// Get activity logs (admin/manager only)
exports.getActivityLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT al.*, u.username, u.full_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
};

// Helper function to combine daily sales and expenses
function combineDailyData(dailySales, dailyExpenses) {
  const dataMap = new Map();

  // Add sales data
  dailySales.forEach(item => {
    dataMap.set(item.date, {
      date: item.date,
      sales: parseFloat(item.total || 0),
      expenses: 0,
      profit: 0
    });
  });

  // Add expenses data
  dailyExpenses.forEach(item => {
    if (dataMap.has(item.date)) {
      const existing = dataMap.get(item.date);
      existing.expenses = parseFloat(item.total || 0);
      existing.profit = existing.sales - existing.expenses;
    } else {
      dataMap.set(item.date, {
        date: item.date,
        sales: 0,
        expenses: parseFloat(item.total || 0),
        profit: -parseFloat(item.total || 0)
      });
    }
  });

  return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = exports;
