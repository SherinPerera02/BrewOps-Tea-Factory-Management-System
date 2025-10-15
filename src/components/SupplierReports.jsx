import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FaBox, FaWeight, FaDollarSign, FaChartLine, FaFileDownload, FaFileExcel } from 'react-icons/fa';

function downloadCSV(filename, rows) {
  const process = (row) => Object.values(row).map((v) => {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
  const header = Object.keys(rows[0] || {}).join(',');
  const csv = [header, ...rows.map(process)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

export default function SupplierReports({ supplyStats, paymentStats, chartData, supplyList = [] }) {
  const [tab, setTab] = useState('supply');
  const [sortConfig, setSortConfig] = useState({ key: 'supply_date', dir: 'desc' });

  const sortedSupplies = [...supplyList].sort((a, b) => {
    const dir = sortConfig.dir === 'asc' ? 1 : -1;
    const av = a[sortConfig.key];
    const bv = b[sortConfig.key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  function setSort(key) {
    setSortConfig((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '10px 16px',
        borderRadius: '12px',
        border: tab === id ? '1px solid #10b981' : '1px solid #e5e7eb',
        backgroundColor: tab === id ? '#d1fae5' : '#fff',
        color: '#065f46',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s ease'
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">My Reports</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <TabButton id="supply" label="Supply History" />
        <TabButton id="payment" label="Payment Reports" />
        <TabButton id="summary" label="Performance Summary" />
      </div>

      {tab === 'supply' && (
        <div className="dashboard-section">
          <h2 className="section-title">My Supply Records</h2>
          <div style={{ marginBottom: '16px', color: '#374151', lineHeight: 1.8 }}>
            <div>Total Supplies Delivered: <strong>{supplyStats?.totalSupplies || 0}</strong></div>
            <div>Total Quantity Supplied: <strong>{(supplyStats?.totalQuantity || 0).toLocaleString()} kg</strong></div>
            <div>Total Earnings: <strong>Rs. {(supplyStats?.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Average Unit Price: <strong>Rs. {(supplyStats?.avgPrice || 0).toFixed(2)}/kg</strong></div>
            <div>Monthly Average: <strong>{(supplyStats?.monthlyAverage || 0).toLocaleString()} kg</strong></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#065f46' }}>No</th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('supply_id')}>
                    Supply ID {sortConfig.key === 'supply_id' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('quantity_kg')}>
                    Quantity (kg) {sortConfig.key === 'quantity_kg' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('unit_price')}>
                    Unit Price {sortConfig.key === 'unit_price' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('total_payment')}>
                    Total Payment {sortConfig.key === 'total_payment' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('payment_status')}>
                    Status {sortConfig.key === 'payment_status' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('payment_method')}>
                    Payment Method {sortConfig.key === 'payment_method' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', cursor: 'pointer', fontWeight: 600, color: '#065f46' }} onClick={() => setSort('supply_date')}>
                    Supply Date {sortConfig.key === 'supply_date' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSupplies.length > 0 ? (
                  sortedSupplies.map((r, idx) => (
                    <tr key={r.id || r.supply_id || idx} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 8px', color: '#065f46', fontWeight: 600 }}>{sortedSupplies.findIndex(s => (s.id ?? s.supply_id) === (r.id ?? r.supply_id)) + 1}</td>
                      <td style={{ padding: '12px 8px', color: '#065f46', fontWeight: 600 }}>{r.supply_id}</td>
                      <td style={{ padding: '12px 8px' }}>{parseFloat(r.quantity_kg || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px' }}>Rs. {parseFloat(r.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: '#065f46' }}>Rs. {parseFloat(r.total_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: r.payment_status === 'paid' ? '#d1fae5' : r.payment_status === 'pending' ? '#fef3c7' : '#fee2e2',
                          color: r.payment_status === 'paid' ? '#065f46' : r.payment_status === 'pending' ? '#92400e' : '#991b1b'
                        }}>
                          {r.payment_status?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{r.payment_method || 'N/A'}</td>
                      <td style={{ padding: '12px 8px' }}>{r.supply_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                      No supply records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => downloadCSV('my_supply_records.csv', sortedSupplies.map(r => ({
                supply_id: r.supply_id,
                quantity_kg: r.quantity_kg,
                unit_price: r.unit_price,
                total_payment: r.total_payment,
                payment_status: r.payment_status,
                payment_method: r.payment_method,
                supply_date: r.supply_date,
              })))} 
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #10b981', 
                backgroundColor: '#fff',
                color: '#065f46',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <FaFileDownload style={{ marginRight: '8px' }} />
              Export CSV
            </button>
            <button 
              onClick={() => downloadExcel('my_supply_records.xlsx', [{ name: 'MySupplies', data: sortedSupplies.map(r => ({
                SupplyID: r.supply_id,
                QuantityKG: r.quantity_kg,
                UnitPrice: r.unit_price,
                TotalPayment: r.total_payment,
                PaymentStatus: r.payment_status,
                PaymentMethod: r.payment_method,
                SupplyDate: r.supply_date,
              })) }])}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #10b981', 
                backgroundColor: '#fff',
                color: '#065f46',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <FaFileExcel style={{ marginRight: '8px' }} />
              Export Excel
            </button>
          </div>
        </div>
      )}

      {tab === 'payment' && (
        <div className="dashboard-section">
          <h2 className="section-title">Payment Summary</h2>
          <div style={{ color: '#374151', lineHeight: 1.8, marginBottom: '16px' }}>
            <div>Total Payment Records: <strong>{paymentStats?.totalPayments || 0}</strong></div>
            <div>Completed Payments: <strong>Rs. {parseFloat(paymentStats?.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Pending Payments: <strong>Rs. {parseFloat(paymentStats?.pendingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Completed Count: <strong style={{ color: '#059669' }}>{paymentStats?.paidCount || 0}</strong></div>
            <div>Pending Count: <strong style={{ color: '#d97706' }}>{paymentStats?.pendingCount || 0}</strong></div>
            <div>Payment Rate: <strong>{paymentStats?.totalPayments > 0 ? ((paymentStats?.paidCount / paymentStats?.totalPayments) * 100).toFixed(1) : 0}%</strong></div>
          </div>

          {/* Payment breakdown by status */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981'
            }}>
              <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '8px' }}>Paid Payments</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#065f46' }}>
                Rs. {parseFloat(paymentStats?.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                {paymentStats?.paidCount || 0} transactions
              </div>
            </div>
            
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b'
            }}>
              <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>Pending Payments</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>
                Rs. {parseFloat(paymentStats?.pendingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
                {paymentStats?.pendingCount || 0} transactions
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => downloadCSV('my_payment_summary.csv', [{
              total_payments: paymentStats?.totalPayments || 0,
              paid_amount: paymentStats?.paidAmount || 0,
              pending_amount: paymentStats?.pendingAmount || 0,
              paid_count: paymentStats?.paidCount || 0,
              pending_count: paymentStats?.pendingCount || 0,
            }])}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #10b981', 
                backgroundColor: '#fff',
                color: '#065f46',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <FaFileDownload style={{ marginRight: '8px' }} />
              Export CSV
            </button>
            <button onClick={() => downloadExcel('my_payment_summary.xlsx', [{ name: 'Payments', data: [{
              TotalPayments: paymentStats?.totalPayments || 0,
              PaidAmount: paymentStats?.paidAmount || 0,
              PendingAmount: paymentStats?.pendingAmount || 0,
              PaidCount: paymentStats?.paidCount || 0,
              PendingCount: paymentStats?.pendingCount || 0,
            }] }])}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #10b981', 
                backgroundColor: '#fff',
                color: '#065f46',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <FaFileExcel style={{ marginRight: '8px' }} />
              Export Excel
            </button>
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="dashboard-section">
          <h2 className="section-title">Performance Summary</h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaBox /> Total Supplies
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>
                {supplyStats?.totalSupplies || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Deliveries completed
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaWeight /> Total Quantity
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>
                {(supplyStats?.totalQuantity || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Kilograms supplied
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaDollarSign /> Total Earnings
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>
                Rs. {(supplyStats?.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Cumulative revenue
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaChartLine /> Avg Unit Price
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>
                Rs. {(supplyStats?.avgPrice || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Per kilogram
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '24px', 
            borderRadius: '12px', 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#065f46', marginBottom: '20px' }}>
              Monthly Performance Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '8px' }}>Monthly Average Supply</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#065f46' }}>
                  {(supplyStats?.monthlyAverage || 0).toLocaleString()} kg
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '8px' }}>Completion Rate</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#065f46' }}>
                  {(supplyStats?.completionRate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => downloadCSV('my_performance_summary.csv', [{
              total_supplies: supplyStats?.totalSupplies || 0,
              total_quantity_kg: supplyStats?.totalQuantity || 0,
              total_earnings: supplyStats?.totalEarnings || 0,
              avg_unit_price: supplyStats?.avgPrice || 0,
              monthly_average: supplyStats?.monthlyAverage || 0,
              completion_rate: supplyStats?.completionRate || 0,
            }])}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #10b981', 
                backgroundColor: '#fff',
                color: '#065f46',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <FaFileDownload style={{ marginRight: '8px' }} />
              Export CSV
            </button>
            <button onClick={() => downloadExcel('my_performance_summary.xlsx', [{ name: 'Performance', data: [{
              TotalSupplies: supplyStats?.totalSupplies || 0,
              TotalQuantityKG: supplyStats?.totalQuantity || 0,
              TotalEarnings: supplyStats?.totalEarnings || 0,
              AvgUnitPrice: supplyStats?.avgPrice || 0,
              MonthlyAverage: supplyStats?.monthlyAverage || 0,
              CompletionRate: supplyStats?.completionRate || 0,
            }] }])}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #10b981', 
                backgroundColor: '#fff',
                color: '#065f46',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <FaFileExcel style={{ marginRight: '8px' }} />
              Export Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
