const Salary = require('../models/Salary');
const { logActivity } = require('../middleware/logger');

// Get all salaries
exports.getSalaries = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const salaries = await Salary.getAll(startDate, endDate);
    res.json({ salaries });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: 'Failed to get salaries' });
  }
};

// Get salary by ID
exports.getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;
    const salary = await Salary.getById(id);

    if (!salary) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    res.json({ salary });
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ error: 'Failed to get salary' });
  }
};

// Create new salary record
exports.createSalary = async (req, res) => {
  try {
    const { date, amount, employeeId, position, notes } = req.body;

    const salary = await Salary.create({
      date,
      amount,
      employee_id: employeeId,
      position,
      notes,
      created_by: req.user.id
    });

    // Log activity
    await logActivity(req.user.id, 'create_salary', 'salary', salary.id, req);

    res.status(201).json({
      message: 'Salary record created successfully',
      salary
    });
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ error: 'Failed to create salary record' });
  }
};

// Update salary record
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const salary = await Salary.update(id, { amount, notes });

    if (!salary) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'update_salary', 'salary', id, req);

    res.json({
      message: 'Salary record updated successfully',
      salary
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ error: 'Failed to update salary record' });
  }
};

// Delete salary record
exports.deleteSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.delete(id);

    if (!salary) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'delete_salary', 'salary', id, req);

    res.json({
      message: 'Salary record deleted successfully',
      salary
    });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ error: 'Failed to delete salary record' });
  }
};

// Get salary summary
exports.getSalarySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await Salary.getSummary(startDate, endDate);
    res.json({ summary });
  } catch (error) {
    console.error('Get salary summary error:', error);
    res.status(500).json({ error: 'Failed to get salary summary' });
  }
};
