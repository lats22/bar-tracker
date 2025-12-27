import { useState, useEffect } from 'react';
import { salesService } from '../services/sales';
import { ladiesService } from '../services/ladies';
import { formatCurrency, formatNumber } from '../utils/format';
import { formatDisplayDate, getToday, getThisMonth } from '../utils/date';
import { format, startOfMonth, endOfMonth } from 'date-fns';

function Sales({ user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [editingDate, setEditingDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Ladies tracking
  const [ladies, setLadies] = useState([]);
  const [ladyDrinkEntries, setLadyDrinkEntries] = useState([]);
  const [newLadyName, setNewLadyName] = useState('');
  const [showAddLady, setShowAddLady] = useState(false);
  const [ladyDrinksData, setLadyDrinksData] = useState([]);

  const categories = ['drinks', 'barfine'];
  const paymentMethods = ['cash', 'transfer'];

  // Initialize grid data
  const initializeGridData = () => {
    const data = {};
    categories.forEach(cat => {
      data[cat] = {};
      paymentMethods.forEach(pm => {
        data[cat][pm] = '';
      });
    });
    return data;
  };

  const [gridData, setGridData] = useState(initializeGridData());

  useEffect(() => {
    loadLadies();
  }, []);

  useEffect(() => {
    loadSales();
  }, [selectedMonth]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1);
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      const data = await salesService.getAll({ startDate, endDate });
      setSales(data.sales);

      // Load lady drinks for the same period
      try {
        const ladyDrinksResult = await ladiesService.getLadyDrinksByDateRange(startDate, endDate);
        setLadyDrinksData(ladyDrinksResult.ladyDrinks || []);
      } catch (err) {
        console.error('Failed to load lady drinks:', err);
        setLadyDrinksData([]);
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLadies = async () => {
    try {
      const data = await ladiesService.getAll();
      setLadies(data.ladies || []);
    } catch (err) {
      console.error('Failed to load ladies:', err);
    }
  };

  const handleGridChange = (category, paymentMethod, value) => {
    setGridData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [paymentMethod]: value
      }
    }));
  };

  const handleAddLadyDrinkEntry = () => {
    setLadyDrinkEntries([...ladyDrinkEntries, { ladyId: '', drinkCount: 0 }]);
  };

  const handleRemoveLadyDrinkEntry = (index) => {
    setLadyDrinkEntries(ladyDrinkEntries.filter((_, i) => i !== index));
  };

  const handleLadyDrinkChange = (index, field, value) => {
    const newEntries = [...ladyDrinkEntries];
    newEntries[index][field] = value;
    setLadyDrinkEntries(newEntries);
  };

  const handleAddNewLady = async () => {
    if (!newLadyName.trim()) {
      alert('Please enter a lady name');
      return;
    }
    try {
      const result = await ladiesService.create({ name: newLadyName.trim() });
      setLadies([...ladies, result.lady]);
      setNewLadyName('');
      setShowAddLady(false);
      alert('Lady added successfully!');
    } catch (err) {
      alert('Failed to add lady: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditDate = async (date) => {
    // Load sales for this date into the form
    const dateSales = sales.filter(sale => sale.date === date);

    const newGridData = initializeGridData();

    dateSales.forEach(sale => {
      // Skip old ladydrink entries (legacy data)
      if (sale.category !== 'ladydrink') {
        // Default to 'drinks' category if null (for imported data)
        const category = sale.category || 'drinks';
        if (newGridData[category]) {
          newGridData[category][sale.payment_method] = sale.amount;
        }
      }
    });

    setGridData(newGridData);

    // Load lady drinks for this date
    try {
      const ladyDrinksData = await ladiesService.getLadyDrinksByDate(date);
      if (ladyDrinksData.ladyDrinks && ladyDrinksData.ladyDrinks.length > 0) {
        setLadyDrinkEntries(
          ladyDrinksData.ladyDrinks.map(ld => ({
            ladyId: ld.lady_id,
            drinkCount: ld.drink_count
          }))
        );
      } else {
        setLadyDrinkEntries([]);
      }
    } catch (err) {
      console.error('Failed to load lady drinks:', err);
      setLadyDrinkEntries([]);
    }

    setSelectedDate(date);
    setEditingDate(date);
    setShowForm(true);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setGridData(initializeGridData());
    setLadyDrinkEntries([]);
    setSelectedDate(getToday());
    setEditingDate(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If editing, delete all sales for this date first
      if (editingDate) {
        const dateSales = sales.filter(sale => sale.date === editingDate);
        const deletePromises = dateSales.map(sale => salesService.delete(sale.id));
        await Promise.all(deletePromises);
      }

      // Create sales for each non-zero amount
      const promises = [];

      // Add monetary sales (drinks and barfine)
      categories.forEach(category => {
        paymentMethods.forEach(paymentMethod => {
          const value = parseFloat(gridData[category][paymentMethod]);
          if (value && value > 0) {
            promises.push(
              salesService.create({
                date: selectedDate,
                amount: value,
                paymentMethod: paymentMethod,
                category: category,
                notes: ''
              })
            );
          }
        });
      });

      await Promise.all(promises);

      // Save lady drinks if there are any entries
      if (ladyDrinkEntries.length > 0) {
        const validLadyDrinks = ladyDrinkEntries.filter(
          entry => entry.ladyId && parseInt(entry.drinkCount) > 0
        );

        if (validLadyDrinks.length > 0) {
          await ladiesService.saveLadyDrinks(
            selectedDate,
            validLadyDrinks.map(entry => ({
              ladyId: entry.ladyId,
              drinkCount: parseInt(entry.drinkCount)
            }))
          );
        }
      }

      // Reset form
      setGridData(initializeGridData());
      setLadyDrinkEntries([]);
      setSelectedDate(getToday());
      setEditingDate(null);
      setShowForm(false);
      loadSales();
      alert(editingDate ? 'Sales updated successfully!' : 'Sales entries created successfully!');
    } catch (err) {
      alert('Failed to save sales: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Group sales by date
  const groupSalesByDate = () => {
    const grouped = {};
    sales.forEach(sale => {
      // Skip old ladydrink entries (legacy data - now using lady_drinks table)
      if (sale.category === 'ladydrink') {
        return;
      }

      const date = sale.date;
      if (!grouped[date]) {
        grouped[date] = {
          total: 0,
          categories: {},
          payments: {}
        };
      }

      const amount = parseFloat(sale.amount);
      grouped[date].total += amount;

      // Sum by category
      if (!grouped[date].categories[sale.category]) {
        grouped[date].categories[sale.category] = 0;
      }
      grouped[date].categories[sale.category] += amount;

      // Sum by payment method
      if (!grouped[date].payments[sale.payment_method]) {
        grouped[date].payments[sale.payment_method] = 0;
      }
      grouped[date].payments[sale.payment_method] += amount;
    });

    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const totalSales = sales.reduce((sum, sale) => {
    // Don't include lady drinks in monetary total
    if (sale.category === 'ladydrink') return sum;
    return sum + parseFloat(sale.amount);
  }, 0);

  const dailySales = groupSalesByDate();

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sales</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Add Daily Sales
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <h3>{editingDate ? 'Edit Daily Sales' : 'New Daily Sales'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold' }}>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                disabled={!!editingDate}
                style={{ maxWidth: '200px' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Category</th>
                    <th>Cash</th>
                    <th>Transfer</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => {
                    const rowTotal = paymentMethods.reduce((sum, pm) => {
                      const val = parseFloat(gridData[category][pm]) || 0;
                      return sum + val;
                    }, 0);

                    return (
                      <tr key={category}>
                        <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {category}
                        </td>
                        {paymentMethods.map(pm => (
                          <td key={pm}>
                            <input
                              type="number"
                              step="0.01"
                              value={gridData[category][pm]}
                              onChange={(e) => handleGridChange(category, pm, e.target.value)}
                              placeholder="0.00"
                              style={{ width: '100%', maxWidth: '120px' }}
                            />
                          </td>
                        ))}
                        <td style={{ fontWeight: 'bold' }}>
                          {rowTotal > 0 ? formatCurrency(rowTotal) : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <td>Total (฿)</td>
                    {paymentMethods.map(pm => {
                      const colTotal = categories.reduce((sum, cat) => {
                        const val = parseFloat(gridData[cat][pm]) || 0;
                        return sum + val;
                      }, 0);
                      return (
                        <td key={pm}>
                          {colTotal > 0 ? formatCurrency(colTotal) : '-'}
                        </td>
                      );
                    })}
                    <td>
                      {formatCurrency(
                        categories.reduce((sum, cat) => {
                          return sum + paymentMethods.reduce((psum, pm) => {
                            return psum + (parseFloat(gridData[cat][pm]) || 0);
                          }, 0);
                        }, 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Lady Drinks Detail Section */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0 }}>Lady Drinks Detail</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleAddLadyDrinkEntry}
                    className="btn"
                    style={{ padding: '5px 15px', fontSize: '14px', backgroundColor: '#28a745', color: 'white' }}
                  >
                    + Add Lady Drink
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLady(!showAddLady)}
                    className="btn"
                    style={{ padding: '5px 15px', fontSize: '14px', backgroundColor: '#007bff', color: 'white' }}
                  >
                    {showAddLady ? 'Cancel' : '+ New Lady'}
                  </button>
                </div>
              </div>

              {showAddLady && (
                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Add New Lady</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={newLadyName}
                      onChange={(e) => setNewLadyName(e.target.value)}
                      placeholder="Enter lady name"
                      style={{ flex: 1, padding: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewLady}
                      className="btn btn-primary"
                      style={{ padding: '8px 20px' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {ladyDrinkEntries.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
                  No lady drinks added. Click "+ Add Lady Drink" to start.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ladyDrinkEntries.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '5px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>Lady</label>
                        <select
                          value={entry.ladyId}
                          onChange={(e) => handleLadyDrinkChange(index, 'ladyId', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                          required={entry.drinkCount > 0}
                        >
                          <option value="">Select a lady...</option>
                          {ladies.map(lady => (
                            <option key={lady.id} value={lady.id}>{lady.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ width: '150px' }}>
                        <label style={{ fontSize: '12px', color: '#666' }}>Drinks</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={entry.drinkCount}
                          onChange={(e) => handleLadyDrinkChange(index, 'drinkCount', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLadyDrinkEntry(index)}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginTop: '18px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px', fontWeight: 'bold' }}>
                    Total Lady Drinks: {ladyDrinkEntries.reduce((sum, entry) => sum + (parseInt(entry.drinkCount) || 0), 0)} drinks
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingDate ? 'Update Sales' : 'Save All Sales')}
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn" style={{ backgroundColor: '#666', color: 'white' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3>Monthly Sales</h3>
            <div className="stat-value success">{formatCurrency(totalSales)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="sales-month-selector" style={{ fontWeight: 'normal', margin: 0 }}>Month:</label>
            <select
              id="sales-month-selector"
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
        {loading ? (
          <p>Loading...</p>
        ) : dailySales.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>No sales found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {dailySales.map(([date, data]) => (
              <div key={date} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>{formatDisplayDate(date)}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="stat-value success">{formatCurrency(data.total)}</div>
                    {(() => {
                      const dateLadyDrinks = ladyDrinksData.filter(ld => ld.date === date);
                      if (dateLadyDrinks.length > 0) {
                        const totalDrinks = dateLadyDrinks.reduce((sum, ld) => sum + ld.drink_count, 0);
                        return (
                          <div style={{
                            backgroundColor: '#FF1493',
                            color: 'white',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            🍹 {totalDrinks} {totalDrinks !== 1 ? 'drinks' : 'drink'}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <button
                      onClick={() => handleEditDate(date)}
                      className="btn"
                      style={{
                        padding: '5px 15px',
                        fontSize: '14px',
                        backgroundColor: '#2196F3',
                        color: 'white'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <strong>By Category:</strong>
                    <ul style={{ listStyle: 'none', padding: '5px 0', margin: 0 }}>
                      {Object.entries(data.categories).map(([cat, amount]) => (
                        <li key={cat} style={{ padding: '3px 0' }}>
                          <span style={{ textTransform: 'capitalize' }}>{cat}:</span> {formatCurrency(amount)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>By Payment:</strong>
                    <ul style={{ listStyle: 'none', padding: '5px 0', margin: 0 }}>
                      {Object.entries(data.payments).map(([pm, amount]) => (
                        <li key={pm} style={{ padding: '3px 0' }}>
                          <span style={{ textTransform: 'capitalize' }}>{pm}:</span> {formatCurrency(amount)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(() => {
                    const dateLadyDrinks = ladyDrinksData.filter(ld => ld.date === date);
                    if (dateLadyDrinks.length > 0) {
                      const totalDrinks = dateLadyDrinks.reduce((sum, ld) => sum + ld.drink_count, 0);
                      return (
                        <div style={{
                          backgroundColor: '#FFF0F5',
                          padding: '10px',
                          borderRadius: '5px',
                          border: '2px solid #FF1493'
                        }}>
                          <strong style={{ color: '#FF1493', fontSize: '14px' }}>🍹 Lady Drinks:</strong>
                          <ul style={{ listStyle: 'none', padding: '5px 0 0 0', margin: 0 }}>
                            {dateLadyDrinks.map((ld, idx) => (
                              <li key={idx} style={{
                                padding: '5px 0',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}>
                                <span style={{ color: '#FF1493' }}>• {ld.lady_name}:</span>
                                <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>
                                  {ld.drink_count} {ld.drink_count !== 1 ? 'drinks' : 'drink'}
                                </span>
                              </li>
                            ))}
                            <li style={{
                              padding: '8px 0 3px 0',
                              fontWeight: 'bold',
                              color: '#2196F3',
                              borderTop: '2px solid #FF1493',
                              marginTop: '5px',
                              fontSize: '15px'
                            }}>
                              TOTAL: {totalDrinks} {totalDrinks !== 1 ? 'drinks' : 'drink'}
                            </li>
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;
