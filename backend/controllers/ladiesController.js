const Lady = require('../models/Lady');
const LadyDrink = require('../models/LadyDrink');
const { logActivity } = require('../middleware/logger');

// Create new lady
exports.createLady = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if lady already exists
    const existing = await Lady.getByName(name);
    if (existing) {
      return res.status(400).json({ error: 'Lady with this name already exists' });
    }

    const lady = await Lady.create({ name });

    // Log activity
    await logActivity(req.user.id, 'create_lady', 'lady', lady.id, req);

    res.status(201).json({
      message: 'Lady created successfully',
      lady
    });
  } catch (error) {
    console.error('Create lady error:', error);
    res.status(500).json({ error: 'Failed to create lady' });
  }
};

// Get all ladies
exports.getLadies = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const ladies = await Lady.getAll(includeInactive === 'true');

    res.json({ ladies, count: ladies.length });
  } catch (error) {
    console.error('Get ladies error:', error);
    res.status(500).json({ error: 'Failed to get ladies' });
  }
};

// Get lady by ID
exports.getLadyById = async (req, res) => {
  try {
    const { id } = req.params;
    const lady = await Lady.getById(id);

    if (!lady) {
      return res.status(404).json({ error: 'Lady not found' });
    }

    res.json({ lady });
  } catch (error) {
    console.error('Get lady error:', error);
    res.status(500).json({ error: 'Failed to get lady' });
  }
};

// Update lady
exports.updateLady = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If updating name, check for duplicates
    if (updates.name) {
      const existing = await Lady.getByName(updates.name);
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'Lady with this name already exists' });
      }
    }

    const lady = await Lady.update(id, updates);

    if (!lady) {
      return res.status(404).json({ error: 'Lady not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'update_lady', 'lady', id, req);

    res.json({
      message: 'Lady updated successfully',
      lady
    });
  } catch (error) {
    console.error('Update lady error:', error);
    res.status(500).json({ error: 'Failed to update lady' });
  }
};

// Deactivate lady
exports.deactivateLady = async (req, res) => {
  try {
    const { id } = req.params;

    const lady = await Lady.deactivate(id);

    if (!lady) {
      return res.status(404).json({ error: 'Lady not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'deactivate_lady', 'lady', id, req);

    res.json({
      message: 'Lady deactivated successfully',
      lady
    });
  } catch (error) {
    console.error('Deactivate lady error:', error);
    res.status(500).json({ error: 'Failed to deactivate lady' });
  }
};

// Save lady drinks for a date
exports.saveLadyDrinks = async (req, res) => {
  try {
    const { date, ladyDrinks } = req.body;
    // ladyDrinks should be an array like: [{ ladyId, drinkCount }, ...]

    if (!Array.isArray(ladyDrinks)) {
      return res.status(400).json({ error: 'ladyDrinks must be an array' });
    }

    const results = await LadyDrink.batchUpsert(date, ladyDrinks, req.user.id);

    // Log activity
    await logActivity(req.user.id, 'save_lady_drinks', 'lady_drinks', date, req);

    res.status(201).json({
      message: 'Lady drinks saved successfully',
      results
    });
  } catch (error) {
    console.error('Save lady drinks error:', error);
    res.status(500).json({ error: 'Failed to save lady drinks' });
  }
};

// Get lady drinks for a specific date
exports.getLadyDrinksByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const ladyDrinks = await LadyDrink.getByDate(date);

    res.json({ ladyDrinks, count: ladyDrinks.length });
  } catch (error) {
    console.error('Get lady drinks error:', error);
    res.status(500).json({ error: 'Failed to get lady drinks' });
  }
};

// Get lady drinks summary for date range
exports.getLadyDrinksSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const summary = await LadyDrink.getSummary(startDate, endDate);

    res.json({ summary, count: summary.length });
  } catch (error) {
    console.error('Get lady drinks summary error:', error);
    res.status(500).json({ error: 'Failed to get lady drinks summary' });
  }
};

// Get lady drinks for date range
exports.getLadyDrinksByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const ladyDrinks = await LadyDrink.getByDateRange(startDate, endDate);

    res.json({ ladyDrinks, count: ladyDrinks.length });
  } catch (error) {
    console.error('Get lady drinks by date range error:', error);
    res.status(500).json({ error: 'Failed to get lady drinks' });
  }
};
