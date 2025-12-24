const Expense = require('../models/Expense');
const { logActivity } = require('../middleware/logger');

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const { date, amount, category, vendor, description, receiptUrl } = req.body;

    const expense = await Expense.create({
      date,
      amount,
      category,
      vendor,
      description,
      receiptUrl,
      createdBy: req.user.id
    });

    // Log activity
    await logActivity(req.user.id, 'create_expense', 'expense', expense.id, req);

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

// Get all expenses with optional filters
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, vendor } = req.query;

    const expenses = await Expense.getAll({
      startDate,
      endDate,
      category,
      vendor
    });

    res.json({ expenses, count: expenses.length });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.getById(id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to get expense' });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const expense = await Expense.update(id, updates);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'update_expense', 'expense', id, req);

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    await Expense.delete(id);

    // Log activity
    await logActivity(req.user.id, 'delete_expense', 'expense', id, req);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// Get expenses summary
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const summary = await Expense.getSummary(startDate, endDate);
    const byCategory = await Expense.getByCategory(startDate, endDate);
    const dailyExpenses = await Expense.getDailyExpenses(startDate, endDate);
    const topVendors = await Expense.getTopVendors(startDate, endDate);

    res.json({
      summary,
      byCategory,
      dailyExpenses,
      topVendors
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
};
