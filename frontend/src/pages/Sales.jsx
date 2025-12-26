import { useState, useEffect } from 'react';
import { salesService } from '../services/sales';
import { formatCurrency, formatNumber } from '../utils/format';
import { formatDisplayDate, getToday, getThisMonth } from '../utils/date';

function Sales({ user }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());

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
  const [ladyDrinks, setLadyDrinks] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const period = getThisMonth();
      const data = await salesService.getAll(period);
      setSales(data.sales);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      // Add lady drinks as a separate entry (not tied to payment method)
      const ladyDrinkCount = parseInt(ladyDrinks);
      if (ladyDrinkCount && ladyDrinkCount > 0) {
        promises.push(
          salesService.create({
            date: selectedDate,
            amount: ladyDrinkCount,
            paymentMethod: 'ladydrink',
            category: 'ladydrink',
            notes: `${ladyDrinkCount} drinks`
          })
        );
      }

      await Promise.all(promises);

      // Reset form
      setGridData(initializeGridData());
      setLadyDrinks('');
      setSelectedDate(getToday());
      setShowForm(false);
      loadSales();
      alert('Sales entries created successfully!');
    } catch (err) {
      alert('Failed to create sales: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Group sales by date
  const groupSalesByDate = () => {
    const grouped = {};
    sales.forEach(sale => {
      const date = sale.date;
      if (!grouped[date]) {
        grouped[date] = {
          total: 0,
          ladyDrinks: 0,
          categories: {},
          payments: {}
        };
      }

      const amount = parseFloat(sale.amount);

      // Handle lady drinks separately
      if (sale.category === 'ladydrink') {
        grouped[date].ladyDrinks += amount;
      } else {
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
      }
    });

    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const totalSales = sales.reduce((sum, sale) => {
    // Don't include lady drinks in monetary total
    if (sale.category === 'ladydrink') return sum;
    return sum + parseFloat(sale.amount);
  }, 0);

  const dailySales = groupSalesByDate();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sales</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Daily Sales'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h3>Daily Sales Entry</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold' }}>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
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

                  {/* Lady Drinks Row - No payment method split */}
                  <tr style={{ backgroundColor: '#f0f8ff' }}>
                    <td style={{ fontWeight: 'bold' }}>LadyDrink</td>
                    <td colSpan="2">
                      <input
                        type="number"
                        step="1"
                        value={ladyDrinks}
                        onChange={(e) => setLadyDrinks(e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', maxWidth: '120px' }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {ladyDrinks && parseInt(ladyDrinks) > 0 ? `${parseInt(ladyDrinks)} drinks` : '-'}
                    </td>
                  </tr>

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

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save All Sales'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Daily Sales Summary</h3>
          <div className="stat-value success">{formatCurrency(totalSales)}</div>
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
                  <div className="stat-value success">{formatCurrency(data.total)}</div>
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
                      {data.ladyDrinks > 0 && (
                        <li style={{ padding: '3px 0', color: '#2196F3' }}>
                          LadyDrink: {Math.round(data.ladyDrinks)} drinks
                        </li>
                      )}
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
