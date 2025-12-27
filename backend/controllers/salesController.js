const Sale = require('../models/Sale');
const { logActivity } = require('../middleware/logger');

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const { date, amount, paymentMethod, category, notes } = req.body;

    const sale = await Sale.create({
      date,
      amount,
      paymentMethod,
      category,
      notes,
      createdBy: req.user.id
    });

    // Log activity
    await logActivity(req.user.id, 'create_sale', 'sale', sale.id, req);

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
};

// Get all sales with optional filters
exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, category, paymentMethod } = req.query;
    console.log('GET /api/sales - Filters:', { startDate, endDate, category, paymentMethod });

    const sales = await Sale.getAll({
      startDate,
      endDate,
      category,
      paymentMethod
    });

    console.log('GET /api/sales - Returning', sales.length, 'sales records');
    if (sales.length > 0) {
      console.log('Sample record:', sales[0]);
    }

    // Prevent browser caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({ sales, count: sales.length });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to get sales' });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.getById(id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Failed to get sale' });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sale = await Sale.update(id, updates);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'update_sale', 'sale', id, req);

    res.json({
      message: 'Sale updated successfully',
      sale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    await Sale.delete(id);

    // Log activity
    await logActivity(req.user.id, 'delete_sale', 'sale', id, req);

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};

// Get sales summary
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const summary = await Sale.getSummary(startDate, endDate);
    const byCategory = await Sale.getByCategory(startDate, endDate);
    const byPaymentMethod = await Sale.getByPaymentMethod(startDate, endDate);
    const dailySales = await Sale.getDailySales(startDate, endDate);

    res.json({
      summary,
      byCategory,
      byPaymentMethod,
      dailySales
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
};
