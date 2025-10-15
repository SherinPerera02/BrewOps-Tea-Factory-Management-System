import React, { useState, useEffect } from 'react';
import { Download, Package, TrendingUp, AlertCircle, FileText, RefreshCw, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './InventoryReports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InventoryReports = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartLimit, setChartLimit] = useState(50);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Fetch basic inventory data
      const inventoryResponse = await fetch('http://localhost:5000/api/manager/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!inventoryResponse.ok) {
        throw new Error('Failed to fetch inventory data');
      }

      const inventoryResult = await inventoryResponse.json();
      if (inventoryResult.success) {
        setInventoryData(inventoryResult.data || []);
      }

      // Fetch basic stats
      const statsResponse = await fetch('http://localhost:5000/api/manager/inventory/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStatsData(statsResult.data);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!inventoryData || inventoryData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    // headers include both date and time
    const headers = ['Inventory ID', 'Quantity', 'Created Date', 'Created Time', 'Last Updated'];

    const detectDate = (item) => {
      // common field names
      const candidates = ['createdAt', 'created_at', 'created', 'createdDate', 'created_date', 'dateCreated'];
      for (const key of candidates) {
        if (item[key]) return item[key];
      }
      // fallback to updated fields
      if (item.updatedAt) return item.updatedAt;
      if (item.updated_at) return item.updated_at;
      return null;
    };

    const rows = inventoryData.map(item => {
      const rawCreated = detectDate(item);
      let createdDate = '';
      let createdTime = '';
      if (rawCreated) {
        const d = typeof rawCreated === 'number' ? new Date(rawCreated) : new Date(rawCreated);
        if (!isNaN(d)) {
          createdDate = d.toLocaleDateString();
          createdTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
      }

      const rawUpdated = item.updatedAt || item.updated_at || item.updated || null;
      const updatedStr = rawUpdated ? (isNaN(new Date(rawUpdated)) ? String(rawUpdated) : new Date(rawUpdated).toLocaleString()) : '';

      return [
        item.inventoryid || 'N/A',
        item.quantity || 0,
        createdDate,
        createdTime,
        updatedStr
      ];
    });

    // escape fields
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV report downloaded successfully');
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Loading inventory data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Failed to Load Inventory</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="inventory-reports-container">
      {/* Header Section */}
      <div className="header-section">
        <h1 className="header-title">
          📊 Inventory Reports Dashboard
        </h1>
        <p className="header-subtitle">
          Current inventory status and basic statistics
        </p>
        <div className="header-actions">
          <button
            onClick={downloadCSV}
            className="download-button"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="download-button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">
            <div className="card-icon">
              <Package size={24} />
            </div>
          </div>
          <div className="card-value">{inventoryData?.length || 0}</div>
          <div className="card-label">Total Items</div>
          <div className="card-sublabel">Inventory entries</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <div className="card-icon">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="card-value">{inventoryData?.reduce((total, item) => total + (item.quantity || 0), 0) || 0}</div>
          <div className="card-label">Total Quantity</div>
          <div className="card-sublabel">Combined inventory</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <div className="card-icon">
              <Package size={24} />
            </div>
          </div>
          <div className="card-value">{inventoryData?.length > 0 ? (inventoryData.reduce((total, item) => total + (item.quantity || 0), 0) / inventoryData.length).toFixed(1) : '0.0'}</div>
          <div className="card-label">Average Quantity</div>
          <div className="card-sublabel">Per inventory item</div>
        </div>
      </div>

      {/* Inventory Chart Section */}
      {inventoryData && inventoryData.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <div className="chart-header-left">
              <h3 className="chart-title">
                <BarChart3 size={20} />
                Latest {chartLimit} Inventory Items
              </h3>
              <p className="chart-description">
                Sorted by creation time (newest to oldest)
              </p>
            </div>
            <div className="chart-header-right">
              <label className="chart-limit-label">Show:</label>
              <select 
                className="chart-limit-select"
                value={chartLimit}
                onChange={(e) => setChartLimit(Number(e.target.value))}
              >
                <option value={10}>Latest 10</option>
                <option value={20}>Latest 20</option>
                <option value={50}>Latest 50</option>
                <option value={100}>Latest 100</option>
                <option value={inventoryData.length}>All ({inventoryData.length})</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            <Bar
              data={{
                labels: inventoryData
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, chartLimit)
                  .map(item => `${item.inventoryid || 'N/A'}`),
                datasets: [
                  {
                    label: 'Quantity',
                    data: inventoryData
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, chartLimit)
                      .map(item => item.quantity || 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Quantity'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Inventory ID'
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 0
                    }
                  }
                }
              }}
              height={400}
            />
          </div>
        </div>
      )}

      {/* Inventory Table */}
      {inventoryData && inventoryData.length > 0 ? (
        <div className="table-section">
          <div className="table-header">
            <h3 className="table-title">
              <Package size={20} />
              Recent Inventory Items (Latest 15)
            </h3>
            <p className="table-description">
              Most recently created inventory entries ({inventoryData.length} total)
            </p>
          </div>
          <div className="table-content">
            <table className="performance-table">
              <thead className="table-head">
                <tr>
                  <th>ID</th>
                  <th>Inventory ID</th>
                  <th>Quantity</th>
                  <th>Created Date</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {inventoryData
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 15)
                  .map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{item.id}</td>
                    <td className="inventory-id-cell">{item.inventoryid}</td>
                    <td>{item.quantity}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-data-container">
          <Package size={48} color="#9ca3af" />
          <div className="no-data-text">No inventory data available</div>
          <button onClick={fetchData} className="retry-button">
            Load Data
          </button>
        </div>
      )}

     
    </div>
  );
};

export default InventoryReports;