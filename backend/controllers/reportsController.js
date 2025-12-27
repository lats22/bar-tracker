const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
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

    // Get salary data
    const salariesSummary = await Salary.getSummary(startDate, endDate);

    // Calculate profit/loss
    const totalSales = parseFloat(salesSummary.total_sales || 0);
    const totalExpenses = parseFloat(expensesSummary.total_expenses || 0);
    const totalSalaries = parseFloat(salariesSummary.total_amount || 0);
    const netProfit = totalSales - totalExpenses - totalSalaries;
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
      salaries: {
        summary: salariesSummary
      },
      financials: {
        totalSales,
        totalExpenses,
        totalSalaries,
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
    const now = new Date();

    // Calculate last 3 months
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      months.push({
        name: monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      });
    }

    // Get data for each month
    const monthsData = [];
    for (const month of months) {
      const sales = await Sale.getSummary(month.start, month.end);
      const expenses = await Expense.getSummary(month.start, month.end);
      const salaries = await Salary.getSummary(month.start, month.end);

      monthsData.push({
        name: month.name,
        sales: parseFloat(sales.total_sales || 0),
        expenses: parseFloat(expenses.total_expenses || 0),
        salaries: parseFloat(salaries.total_amount || 0),
        profit: parseFloat(sales.total_sales || 0) - parseFloat(expenses.total_expenses || 0) - parseFloat(salaries.total_amount || 0)
      });
    }

    res.json({
      months: monthsData
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
