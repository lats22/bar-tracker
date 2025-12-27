const Employee = require('../models/Employee');
const { logActivity } = require('../middleware/logger');

// Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const employees = await Employee.getAll(includeInactive);
    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to get employees' });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.getById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to get employee' });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, position } = req.body;

    const employee = await Employee.create({
      name,
      position
    });

    // Log activity
    await logActivity(req.user.id, 'create_employee', 'employee', employee.id, req);

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'An employee with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const employee = await Employee.update(id, updates);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'update_employee', 'employee', id, req);

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'An employee with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// Deactivate employee
exports.deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.deactivate(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'deactivate_employee', 'employee', id, req);

    res.json({
      message: 'Employee deactivated successfully',
      employee
    });
  } catch (error) {
    console.error('Deactivate employee error:', error);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
};
