import React, { useState } from 'react';

import * as XLSX from 'xlsx';

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

export default function StaffReports({ supplyStats, paymentStats, chartData, supplyList = [] }) {
  const [tab, setTab] = useState('supplier');
  const [sortConfig, setSortConfig] = useState({ key: 'supply_date', dir: 'desc' });
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState('all'); // 'all' or 0-11
  const [periodYear, setPeriodYear] = useState(String(now.getFullYear()));

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

  // helpers for period filtering
  const parseDate = (d) => {
    try { return new Date(d); } catch (e) { return null; }
  };

  const filteredSupplies = sortedSupplies.filter(s => {
    if (!s) return false;
    if (periodMonth === 'all' || periodYear === 'all') return true;
    const sd = parseDate(s.supply_date);
    if (!sd || isNaN(sd.getTime())) return false;
    return sd.getMonth() === Number(periodMonth) && String(sd.getFullYear()) === String(periodYear);
  });

  const computeTopSuppliersFrom = (supplies) => {
    const map = {};
    supplies.forEach(s => {
      const code = s.supplier_code || s.supplier_id || s.code || s.id || 'unknown';
      const name = s.supplier_name || `Supplier ${code}`;
      if (!map[code]) map[code] = { supplier_code: code, name, count: 0, totalValue: 0 };
      map[code].count++;
      map[code].totalValue += parseFloat(s.total_payment) || 0;
    });
    return Object.values(map).sort((a,b) => b.totalValue - a.totalValue).slice(0,5);
  };

  const monthlyTopSuppliers = computeTopSuppliersFrom(filteredSupplies);

  const computeSupplySummary = (supplies) => {
    const totalSupplies = supplies.length;
    const totalQuantity = supplies.reduce((sum,s) => sum + (parseFloat(s.quantity_kg) || 0), 0);
    const totalValue = supplies.reduce((sum,s) => sum + (parseFloat(s.total_payment) || 0), 0);
    const avgUnitPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    return { totalSupplies, totalQuantity, totalValue, avgUnitPrice };
  };

  const monthlySupplySummary = computeSupplySummary(filteredSupplies);

  const computePaymentSummaryFromSupplies = (supplies) => {
    const completed = supplies.filter(s => {
      const st = (s.payment_status || '').toString().toLowerCase();
      return st === 'paid' || st === 'completed';
    });
    const pending = supplies.filter(s => {
      const st = (s.payment_status || '').toString().toLowerCase();
      return st !== 'paid' && st !== 'completed';
    });
    const completedAmount = completed.reduce((sum,s) => sum + (parseFloat(s.total_payment) || 0), 0);
    const pendingAmount = pending.reduce((sum,s) => sum + (parseFloat(s.total_payment) || 0), 0);
    const totalPayments = completed.length + pending.length;
    const avgPayment = totalPayments > 0 ? (completedAmount + pendingAmount) / totalPayments : 0;
    return { totalPayments, completedAmount, pendingAmount, avgPayment, completedCount: completed.length, pendingCount: pending.length };
  };

  const monthlyPaymentSummary = computePaymentSummaryFromSupplies(filteredSupplies);

  // build list of available years for selector
  const availableYears = Array.from(new Set(supplyList.map(s => {
    try { const d = new Date(s.supply_date); return d && !isNaN(d.getFullYear()) ? d.getFullYear() : null; } catch(e){return null}
  }).filter(Boolean))).sort((a,b)=>b-a);
  if (!availableYears.includes(Number(periodYear))) availableYears.unshift(Number(periodYear));

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '10px 16px',
        borderRadius: '12px',
        border: tab === id ? '1px solid #166534' : '1px solid #e5e7eb',
        backgroundColor: tab === id ? '#f0fdf4' : '#fff',
        color: '#166534',
        cursor: 'pointer',
        fontWeight: 600
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Reports</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <TabButton id="supplier" label="Supplier Reports" />
        <TabButton id="supply" label="Supply Records Reports" />
        <TabButton id="payment" label="Payment Reports" />
      </div>

      {/* Period selector for monthly reports */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Period:</label>
        <select value={periodMonth} onChange={(e)=>setPeriodMonth(e.target.value)} style={{ padding: '6px', borderRadius: 6 }}>
          <option value="all">All</option>
          <option value="0">Jan</option>
          <option value="1">Feb</option>
          <option value="2">Mar</option>
          <option value="3">Apr</option>
          <option value="4">May</option>
          <option value="5">Jun</option>
          <option value="6">Jul</option>
          <option value="7">Aug</option>
          <option value="8">Sep</option>
          <option value="9">Oct</option>
          <option value="10">Nov</option>
          <option value="11">Dec</option>
        </select>
        <select value={periodYear} onChange={(e)=>setPeriodYear(e.target.value)} style={{ padding: '6px', borderRadius: 6 }}>
          <option value="all">All years</option>
          {availableYears.map(y => (<option key={y} value={String(y)}>{y}</option>))}
        </select>
        <div style={{ color: '#6b7280', fontSize: 13 }}>{periodMonth === 'all' ? 'All months' : `Month: ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(periodMonth)]}`}</div>
      </div>

      {tab === 'supplier' && (
        <div className="dashboard-section">
          <h2 className="section-title">Top Suppliers by Value</h2>
          {monthlyTopSuppliers?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>Supplier</th>
                  <th style={{ padding: '8px' }}>Supplier ID</th>
                  <th style={{ padding: '8px' }}>Supplies</th>
                  <th style={{ padding: '8px' }}>Total Value (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTopSuppliers.map((s, i) => {
                  const code = s.supplier_code || s.supplier_id || s.code || s.id || '';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px' }}>{i + 1}</td>
                      <td style={{ padding: '8px' }}>{s.name}</td>
                      <td style={{ padding: '8px', color: '#6b7280', fontWeight: 600 }}>{code}</td>
                      <td style={{ padding: '8px' }}>{s.count}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>Rs. {s.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#6b7280' }}>No supplier data available.</p>
          )}

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button onClick={() => downloadCSV(`supplier_totals_${periodMonth}-${periodYear}.csv`, (monthlyTopSuppliers || []).map((s, i) => ({ rank: i + 1, name: s.name, supplier_code: s.supplier_code || s.supplier_id || s.code || s.id, supplies: s.count, total_value: s.totalValue }))) }
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Export CSV</button>
            <button onClick={() => downloadExcel(`supplier_totals_${periodMonth}-${periodYear}.xlsx`, [{ name: 'SupplierTotals', data: (monthlyTopSuppliers || []).map((s, i) => ({ Rank: i + 1, Supplier: s.name, SupplierCode: s.supplier_code || s.supplier_id || s.code || s.id, Supplies: s.count, TotalValue: s.totalValue })) }])}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Export Excel</button>
          </div>
        </div>
      )}

      {tab === 'supply' && (
        <div className="dashboard-section">
          <h2 className="section-title">Supply Records Summary</h2>
          <div style={{ marginBottom: '12px', color: '#374151' }}>
            <div>Total Records: <strong>{monthlySupplySummary.totalSupplies || 0}</strong></div>
            <div>Total Quantity: <strong>{(monthlySupplySummary.totalQuantity || 0).toLocaleString()} kg</strong></div>
            <div>Total Value: <strong>Rs. {(monthlySupplySummary.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Average Unit Price: <strong>Rs. {(monthlySupplySummary.avgUnitPrice || 0).toFixed(2)}/kg</strong></div>
            <div>Monthly Supplies: <strong>{monthlySupplySummary.totalSupplies || 0}</strong></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px' }}>No</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('supply_id')}>Supply ID</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('supplier_name')}>Supplier</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('quantity_kg')}>Quantity (kg)</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('unit_price')}>Unit Price</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('total_payment')}>Total Payment</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('payment_status')}>Payment Status</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('payment_method')}>Payment Method</th>
                  <th style={{ padding: '8px', cursor: 'pointer' }} onClick={() => setSort('supply_date')}>Supply Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplies.map((r, idx) => (
                  <tr key={r.id || r.supply_id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>{filteredSupplies.findIndex(s => (s.id ?? s.supply_id) === (r.id ?? r.supply_id)) + 1}</td>
                    <td style={{ padding: '8px' }}>{r.supply_id}</td>
                    <td style={{ padding: '8px' }}>{r.supplier_name || r.supplier_id}</td>
                    <td style={{ padding: '8px' }}>{parseFloat(r.quantity_kg || 0).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>Rs. {parseFloat(r.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Rs. {parseFloat(r.total_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px' }}>{r.payment_status}</td>
                    <td style={{ padding: '8px' }}>{r.payment_method}</td>
                    <td style={{ padding: '8px' }}>{r.supply_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => downloadCSV(`supply_records_${periodMonth}-${periodYear}.csv`, filteredSupplies.map(r => ({
                supply_id: r.supply_id,
                supplier: r.supplier_name || r.supplier_id,
                quantity_kg: r.quantity_kg,
                unit_price: r.unit_price,
                total_payment: r.total_payment,
                payment_status: r.payment_status,
                payment_method: r.payment_method,
                supply_date: r.supply_date,
              })))} 
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              Export CSV
            </button>
            <button 
              onClick={() => downloadExcel(`supply_records_${periodMonth}-${periodYear}.xlsx`, [{ name: 'Supplies', data: filteredSupplies.map(r => ({
                SupplyID: r.supply_id,
                Supplier: r.supplier_name || r.supplier_id,
                QuantityKG: r.quantity_kg,
                UnitPrice: r.unit_price,
                TotalPayment: r.total_payment,
                PaymentStatus: r.payment_status,
                PaymentMethod: r.payment_method,
                SupplyDate: r.supply_date,
              })) }])}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              Export Excel
            </button>
          </div>
        </div>
      )}

      {tab === 'payment' && (
        <div className="dashboard-section">
          <h2 className="section-title">Payment Summary</h2>
          <div style={{ color: '#374151', lineHeight: 1.8, marginBottom: '12px' }}>
            <div>Total Payments: <strong>{monthlyPaymentSummary.totalPayments || 0}</strong></div>
            <div>Completed Amount: <strong>Rs. {parseFloat(monthlyPaymentSummary.completedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Pending Amount: <strong>Rs. {parseFloat(monthlyPaymentSummary.pendingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Average Payment: <strong>Rs. {parseFloat(monthlyPaymentSummary.avgPayment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
            <div>Pending Count: <strong>{monthlyPaymentSummary.pendingCount || 0}</strong></div>
            <div>Failed Count: <strong>{paymentStats?.failed_count || 0}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => downloadCSV(`payment_summary_${periodMonth}-${periodYear}.csv`, [{
              total_payments: monthlyPaymentSummary.totalPayments || 0,
              total_completed_amount: monthlyPaymentSummary.completedAmount || 0,
              total_pending_amount: monthlyPaymentSummary.pendingAmount || 0,
              avg_payment_amount: monthlyPaymentSummary.avgPayment || 0,
              completed_count: monthlyPaymentSummary.completedCount || 0,
              pending_count: monthlyPaymentSummary.pendingCount || 0,
              failed_count: paymentStats?.failed_count || 0,
            }])}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Export CSV</button>
            <button onClick={() => downloadExcel(`payment_summary_${periodMonth}-${periodYear}.xlsx`, [{ name: 'Payments', data: [{
              TotalPayments: monthlyPaymentSummary.totalPayments || 0,
              CompletedAmount: monthlyPaymentSummary.completedAmount || 0,
              PendingAmount: monthlyPaymentSummary.pendingAmount || 0,
              AvgPaymentAmount: monthlyPaymentSummary.avgPayment || 0,
              CompletedCount: monthlyPaymentSummary.completedCount || 0,
              PendingCount: monthlyPaymentSummary.pendingCount || 0,
              FailedCount: paymentStats?.failed_count || 0,
            }] }])}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Export Excel</button>
          </div>
        </div>
      )}
    </div>
  );
}
