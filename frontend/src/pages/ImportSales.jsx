import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function ImportSales() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [importResults, setImportResults] = useState(null);
  const [dryRun, setDryRun] = useState(true);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an Excel file
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        setSelectedFile(file);
        setMessage({ type: '', text: '' });
        setImportResults(null);
      } else {
        setMessage({ type: 'error', text: 'Please select an Excel file (.xlsx or .xls)' });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async (isDryRun = true) => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('dryRun', isDryRun);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/upload-sales-excel`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: isDryRun
            ? `Preview completed! Found ${response.data.results.success} rows to import.`
            : `Import completed! Successfully imported ${response.data.results.salesCreated} sales records.`
        });
        setImportResults(response.data.results);

        // If actual import was successful, clear the file
        if (!isDryRun) {
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById('excel-file-input');
          if (fileInput) fileInput.value = '';
        }
      } else {
        setMessage({
          type: 'error',
          text: response.data.error || 'Upload failed'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to upload file. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = () => handleUpload(true);
  const handleActualImport = () => handleUpload(false);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Import Sales from Excel</h1>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <h2>Upload Excel File</h2>

        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', color: '#333' }}>📋 Excel File Format</h3>
          <p style={{ margin: '10px 0', color: '#666' }}>Your Excel file should have these columns:</p>
          <ul style={{ color: '#666', marginLeft: '20px' }}>
            <li><strong>Column A:</strong> Date</li>
            <li><strong>Column B:</strong> Cash amount (฿)</li>
            <li><strong>Column C:</strong> Transfer amount (฿)</li>
            <li><strong>Column D:</strong> Lady name (Ice, Kiki, or Peachy)</li>
            <li><strong>Column E:</strong> Quantity of drinks</li>
          </ul>
          <p style={{ margin: '10px 0', color: '#888', fontSize: '14px' }}>
            <strong>Note:</strong> First row will be skipped (headers). Make sure dates are in a recognizable format. The lady name in Column D must match exactly: Ice, Kiki, or Peachy.
          </p>
        </div>

        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="excel-file-input">Select Excel File *</label>
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="form-control"
            disabled={uploading}
          />
          {selectedFile && (
            <small style={{ color: '#28a745' }}>
              ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </small>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handlePreview}
            className="btn btn-primary"
            disabled={!selectedFile || uploading}
          >
            {uploading && dryRun ? '🔄 Previewing...' : '👁️ Preview Import'}
          </button>

          {importResults && (
            <button
              onClick={handleActualImport}
              className="btn btn-success"
              disabled={uploading}
              style={{ backgroundColor: '#28a745' }}
            >
              {uploading && !dryRun ? '🔄 Importing...' : '✅ Confirm & Import'}
            </button>
          )}
        </div>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <p>
            <strong>Step 1:</strong> Click "Preview Import" to see what will be imported (no changes to database)
            <br />
            <strong>Step 2:</strong> Review the results below
            <br />
            <strong>Step 3:</strong> Click "Confirm & Import" to actually save the data
          </p>
        </div>
      </div>

      {importResults && (
        <div className="card" style={{ maxWidth: '800px', marginTop: '20px' }}>
          <h2>Import Results</h2>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '5px' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {importResults.success}
              </div>
              <div className="stat-label" style={{ color: '#666', fontSize: '14px' }}>Successful Rows</div>
            </div>

            <div className="stat-card" style={{ backgroundColor: '#fff3e0', padding: '15px', borderRadius: '5px' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>
                {importResults.salesCreated}
              </div>
              <div className="stat-label" style={{ color: '#666', fontSize: '14px' }}>Sales Records</div>
            </div>

            <div className="stat-card" style={{ backgroundColor: '#f3e5f5', padding: '15px', borderRadius: '5px' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#6a1b9a' }}>
                {importResults.ladyDrinksCreated}
              </div>
              <div className="stat-label" style={{ color: '#666', fontSize: '14px' }}>Lady Drink Records</div>
            </div>

            {importResults.errors > 0 && (
              <div className="stat-card" style={{ backgroundColor: '#ffebee', padding: '15px', borderRadius: '5px' }}>
                <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>
                  {importResults.errors}
                </div>
                <div className="stat-label" style={{ color: '#666', fontSize: '14px' }}>Errors</div>
              </div>
            )}

            {importResults.skipped > 0 && (
              <div className="stat-card" style={{ backgroundColor: '#e0e0e0', padding: '15px', borderRadius: '5px' }}>
                <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#424242' }}>
                  {importResults.skipped}
                </div>
                <div className="stat-label" style={{ color: '#666', fontSize: '14px' }}>Skipped (Empty)</div>
              </div>
            )}
          </div>

          {importResults.details && importResults.details.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>First 10 Rows Preview:</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
                <table className="table" style={{ fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th>Row</th>
                      <th>Date</th>
                      <th>Cash</th>
                      <th>Transfer</th>
                      <th>Lady Name</th>
                      <th>Drinks Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.details.slice(0, 10).map((detail, index) => (
                      <tr key={index} style={{ backgroundColor: detail.error ? '#ffebee' : 'white' }}>
                        <td>{detail.row}</td>
                        <td>{detail.date || '-'}</td>
                        <td>{detail.cash ? `฿${detail.cash.toFixed(2)}` : '-'}</td>
                        <td>{detail.transfer ? `฿${detail.transfer.toFixed(2)}` : '-'}</td>
                        <td>{detail.ladyName || '-'}</td>
                        <td>{detail.quantity || '-'}</td>
                        <td>
                          {detail.error ? (
                            <span style={{ color: '#c62828' }}>❌ {detail.error}</span>
                          ) : (
                            <span style={{ color: '#2e7d32' }}>✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importResults.details.length > 10 && (
                <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                  Showing 10 of {importResults.details.length} rows
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportSales;
