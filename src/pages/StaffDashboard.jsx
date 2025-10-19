import React, { useState, useEffect, useCallback } from 'react';
import NavigationBar from '../components/navigationBar';
import StaffSidebar from '../components/staffSidebar';
// removed unused StaffOrders import
import StaffReports from '../components/StaffReports';
import ManageSuppliers from '../components/ManageSuppliers';
import SupplyRecords from '../components/SupplyRecords';
import PaymentManagement from '../components/PaymentManagement';
import DashboardCharts from '../components/DashboardCharts';
import Footer from '../components/footer';
import '../styles/StaffDashboard.css';

export default function StaffDashboard() {
  const [activeContent, setActiveContent] = useState('dashboard');
  const [dashboardData] = useState({
    totalTasks: 12,
    pendingTasks: 5,
    hoursThisWeek: 38
  });
  const [dbStats, setDbStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSuppliers: 0,
    deliveredOrders: 0
  });
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    completedAmount: 0,
    pendingAmount: 0,
    avgPaymentAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0
  });
  const [supplyStats, setSupplyStats] = useState({
    totalSupplies: 0,
    totalQuantity: 0,
    totalValue: 0,
    avgUnitPrice: 0,
    monthlySupplies: 0,
    topSuppliers: []
  });
  const [chartData, setChartData] = useState({
    monthlyTrends: [],
    paymentMethods: [],
    supplierPerformance: [],
    weeklySupplies: []
  });
  // monthly overview removed per user request
  const [supplyList, setSupplyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // compute current-month metrics from supplyList
  const getCurrentMonthMetrics = (supplies) => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthSupplies = (Array.isArray(supplies) ? supplies : []).filter(s => {
      if (!s || !s.supply_date) return false;
      const d = new Date(s.supply_date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const count = monthSupplies.length;
    const totalKg = monthSupplies.reduce((sum, s) => sum + (parseFloat(s.quantity_kg) || 0), 0);
    const totalValue = monthSupplies.reduce((sum, s) => sum + (parseFloat(s.total_payment) || 0), 0);
    const avgPrice = totalKg > 0 ? totalValue / totalKg : 0;

    return { count, totalKg, totalValue, avgPrice };
  };

  // compute current-month payment metrics (derived from supply records)
  const getCurrentMonthPaymentMetrics = (supplies) => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthSupplies = (Array.isArray(supplies) ? supplies : []).filter(s => {
      if (!s || !s.supply_date) return false;
      const d = new Date(s.supply_date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const completedSupplies = monthSupplies.filter(s => {
      const st = (s.payment_status || '').toString().toLowerCase();
      return st === 'paid' || st === 'completed';
    });
    const pendingSupplies = monthSupplies.filter(s => {
      const st = (s.payment_status || '').toString().toLowerCase();
      return st !== 'paid' && st !== 'completed';
    });

    const completedAmount = completedSupplies.reduce((sum, s) => sum + (parseFloat(s.total_payment) || 0), 0);
    const pendingAmount = pendingSupplies.reduce((sum, s) => sum + (parseFloat(s.total_payment) || 0), 0);
    const totalPayments = completedSupplies.length + pendingSupplies.length;
    const avgPayment = totalPayments > 0 ? (completedAmount + pendingAmount) / totalPayments : 0;

    return {
      totalPayments,
      completedAmount,
      pendingAmount,
      avgPayment,
      completedCount: completedSupplies.length,
      pendingCount: pendingSupplies.length
    };
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Accept token stored under several possible keys (jwtToken, token) in local or session storage
      const token =
        localStorage.getItem('jwtToken') ||
        sessionStorage.getItem('jwtToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');
      
      // Fetch supply records stats
      const supplyResponse = await fetch('http://localhost:5000/api/staff/supply-records', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch payment statistics
      const paymentResponse = await fetch('http://localhost:5000/api/payment/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Note: suppliersResponse was unused and removed

      if (supplyResponse.ok) {
        const supplyData = await supplyResponse.json();
        const supplies = Array.isArray(supplyData.data) ? supplyData.data : [];
        setSupplyList(supplies);
        
        const totalQuantity = supplies.reduce((sum, item) => sum + (parseFloat(item.quantity_kg) || 0), 0);
        const totalValue = supplies.reduce((sum, item) => sum + (parseFloat(item.total_payment) || 0), 0);
        const avgUnitPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        
        // Get current month supplies
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlySupplies = supplies.filter(supply => {
          const supplyDate = new Date(supply.supply_date);
          return supplyDate.getMonth() === currentMonth && supplyDate.getFullYear() === currentYear;
        }).length;

        // Get supplier stats keyed by supplier_id so same-name suppliers are separate
        const supplierStats = {};
        supplies.forEach(supply => {
          // Prefer supplier_code (SUP000001) returned by backend, fallback to numeric supplier_id
          const sid = supply.supplier_code || supply.supplier_id || `unknown_${Math.random()}`;
          if (!supplierStats[sid]) {
            supplierStats[sid] = {
              supplier_id: sid,
              name: supply.supplier_name || `Supplier ${sid}`,
              count: 0,
              totalValue: 0
            };
          }
          supplierStats[sid].count++;
          supplierStats[sid].totalValue += parseFloat(supply.total_payment) || 0;
        });

        const topSuppliers = Object.values(supplierStats)
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5);

        setSupplyStats({
          totalSupplies: supplies.length,
          totalQuantity: totalQuantity,
          totalValue: totalValue,
          avgUnitPrice: avgUnitPrice,
          monthlySupplies: monthlySupplies,
          topSuppliers: topSuppliers
        });

        // Update basic stats
        setDbStats({
          totalOrders: supplies.length,
          pendingOrders: supplies.filter(s => s.payment_status === 'unpaid').length,
          totalSuppliers: new Set(supplies.map(s => s.supplier_id)).size,
          deliveredOrders: supplies.filter(s => s.payment_status === 'paid').length
        });

        // Generate realistic chart data with supplies data
        generateChartData(supplies);
      }

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        const raw = paymentData.data || {};

        // Normalize keys: accept snake_case or camelCase from backend
        const normalized = {
          total_payments: Number(raw.total_payments ?? raw.totalPayments ?? 0),
          total_completed_amount: Number(raw.total_completed_amount ?? raw.paidAmount ?? raw.paid_amount ?? 0),
          total_pending_amount: Number(raw.total_pending_amount ?? raw.pendingAmount ?? raw.pending_amount ?? 0),
          completed_count: Number(raw.completed_count ?? raw.paidCount ?? raw.paid_count ?? 0),
          pending_count: Number(raw.pending_count ?? raw.pendingCount ?? raw.pending_count ?? 0),
          failed_count: Number(raw.failed_count ?? raw.failedCount ?? raw.failed_count ?? 0),
          avg_payment_amount: raw.avg_payment_amount ?? raw.avgPaymentAmount ?? null,
        };

        setPaymentStats(normalized);
      } else {
        console.warn('Payment statistics fetch returned non-OK:', paymentResponse.status);
        try {
          const errBody = await paymentResponse.json();
          if (errBody && errBody.data) {
            const raw = errBody.data;
            const normalized = {
              total_payments: Number(raw.total_payments ?? raw.totalPayments ?? 0),
              total_completed_amount: Number(raw.total_completed_amount ?? raw.paidAmount ?? raw.paid_amount ?? 0),
              total_pending_amount: Number(raw.total_pending_amount ?? raw.pendingAmount ?? raw.pending_amount ?? 0),
              completed_count: Number(raw.completed_count ?? raw.paidCount ?? raw.paid_count ?? 0),
              pending_count: Number(raw.pending_count ?? raw.pendingCount ?? raw.pending_count ?? 0),
              failed_count: Number(raw.failed_count ?? raw.failedCount ?? raw.failed_count ?? 0),
              avg_payment_amount: raw.avg_payment_amount ?? raw.avgPaymentAmount ?? null,
            };
            console.warn('Using payment stats provided in error response');
            setPaymentStats(normalized);
          } else {
            // Try unauthenticated fallback (useful in development)
            try {
              const fb = await fetch('http://localhost:5000/api/payment/statistics');
              if (fb.ok) {
                const fbJson = await fb.json();
                const raw = fbJson.data || {};
                const normalized = {
                  total_payments: Number(raw.total_payments ?? raw.totalPayments ?? 0),
                  total_completed_amount: Number(raw.total_completed_amount ?? raw.paidAmount ?? raw.paid_amount ?? 0),
                  total_pending_amount: Number(raw.total_pending_amount ?? raw.pendingAmount ?? raw.pending_amount ?? 0),
                  completed_count: Number(raw.completed_count ?? raw.paidCount ?? raw.paid_count ?? 0),
                  pending_count: Number(raw.pending_count ?? raw.pendingCount ?? raw.pending_count ?? 0),
                  failed_count: Number(raw.failed_count ?? raw.failedCount ?? raw.failed_count ?? 0),
                  avg_payment_amount: raw.avg_payment_amount ?? raw.avgPaymentAmount ?? null,
                };
                console.warn('Fetched payment stats without auth as fallback');
                setPaymentStats(normalized);
              } else {
                console.warn('Fallback payment stats fetch failed:', fb.status);
              }
            } catch (fbErr) {
              console.error('Fallback payment stats fetch error:', fbErr);
            }
          }
        } catch (parseErr) {
          console.error('Failed to parse non-OK payment stats response:', parseErr);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);


  // fetchDashboardStats is defined above with useCallback

  const generateChartData = (supplies) => {
    // Generate monthly trends for last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyTrends = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthSupplies = supplies.filter(supply => {
        const supplyDate = new Date(supply.supply_date);
        return supplyDate.getMonth() === monthIndex;
      });
      
      monthlyTrends.push({
        month: monthNames[monthIndex],
        supplies: monthSupplies.length,
        value: monthSupplies.reduce((sum, s) => sum + (parseFloat(s.total_payment) || 0), 0),
        quantity: monthSupplies.reduce((sum, s) => sum + (parseFloat(s.quantity_kg) || 0), 0)
      });
    }

    // Payment methods distribution
    const paymentMethodsMap = {};
    supplies.forEach(supply => {
      const method = supply.payment_method || 'spot';
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = { count: 0, value: 0 };
      }
      paymentMethodsMap[method].count++;
      paymentMethodsMap[method].value += parseFloat(supply.total_payment) || 0;
    });

    const paymentMethods = Object.entries(paymentMethodsMap).map(([method, data]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      count: data.count,
      value: data.value,
      percentage: supplies.length > 0 ? ((data.count / supplies.length) * 100).toFixed(1) : 0
    }));

    // Weekly supplies for last 4 weeks
    const weeklySupplies = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekSupplies = supplies.filter(supply => {
        const supplyDate = new Date(supply.supply_date);
        return supplyDate >= weekStart && supplyDate <= weekEnd;
      });
      
      weeklySupplies.push({
        week: `Week ${4 - i}`,
        supplies: weekSupplies.length,
        quantity: weekSupplies.reduce((sum, s) => sum + (parseFloat(s.quantity_kg) || 0), 0)
      });
    }

    // Calculate top suppliers performance
    const supplierPerformanceMap = {};
    supplies.forEach(supply => {
      const supplierId = supply.supplier_id || 'Unknown';
      const supplierName = supply.supplier_name || `Supplier ${supplierId}`;
      
      if (!supplierPerformanceMap[supplierId]) {
        supplierPerformanceMap[supplierId] = {
          name: supplierName,
          count: 0,
          totalValue: 0,
          totalQuantity: 0
        };
      }
      
      supplierPerformanceMap[supplierId].count++;
      supplierPerformanceMap[supplierId].totalValue += parseFloat(supply.total_payment) || 0;
      supplierPerformanceMap[supplierId].totalQuantity += parseFloat(supply.quantity_kg) || 0;
    });

    const topSuppliers = Object.values(supplierPerformanceMap)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    setChartData({
      monthlyTrends,
      paymentMethods,
      weeklySupplies,
      supplierPerformance: topSuppliers
    });
  };

  const renderContent = () => {
    switch (activeContent) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h1 className="dashboard-title">Staff Dashboard</h1>
            
            {loading ? (
              <div className="loading-container">
                <p className="loading-text">Loading dashboard data...</p>
              </div>
            ) : (
              <>
                {/* Supply Management Metrics */}
                <div className="dashboard-section">
                  <h2 className="section-title">Supply Management Overview</h2>
                  <div className="metrics-grid">
                    {(() => {
                      const m = getCurrentMonthMetrics(supplyList);
                      return (
                        <>
                          <div className="metric-card">
                            <h3 className="card-title">Supply Records</h3>
                            <p className="card-value" style={{ color: '#3b82f6' }}>
                              {m.count}
                            </p>
                            <p className="card-description">Deliveries this month</p>
                          </div>

                          <div className="metric-card">
                            <h3 className="card-title">Quantity</h3>
                            <p className="card-value" style={{ color: '#10b981' }}>
                              {m.totalKg.toLocaleString()} kg
                            </p>
                            <p className="card-description">Tea leaves this month</p>
                          </div>

                          <div className="metric-card">
                            <h3 className="card-title">Value</h3>
                            <p className="card-value" style={{ color: '#f59e0b' }}>
                              Rs. {m.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="card-description">Payments this month</p>
                          </div>

                          <div className="metric-card">
                            <h3 className="card-title">Avg Price</h3>
                            <p className="card-value" style={{ color: '#8b5cf6' }}>
                              Rs. {m.avgPrice.toFixed(2)}/kg
                            </p>
                            <p className="card-description">Average price this month</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Payment Statistics */}
                <div className="dashboard-section">
                  <h2 className="section-title">Payment Analytics (This Month)</h2>
                  <div className="inventory-grid">
                    {(() => {
                      const pm = getCurrentMonthPaymentMetrics(supplyList);
                      return (
                        <>
                          <div className="inventory-card blue">
                            <h3 className="card-title">Total Payments</h3>
                            <p className="card-value" style={{ color: '#3b82f6' }}>
                              {pm.totalPayments || paymentStats.total_payments || 0}
                            </p>
                            <p className="card-description">Payment transactions this month</p>
                          </div>

                          <div className="inventory-card green">
                            <h3 className="card-title">Completed Amount</h3>
                            <p className="card-value" style={{ color: '#10b981' }}>
                              Rs. {parseFloat(pm.completedAmount || paymentStats.total_completed_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="card-description">{(pm.completedCount ?? paymentStats.completed_count) || 0} completed</p>
                          </div>

                          <div className="inventory-card yellow">
                            <h3 className="card-title">Pending Amount</h3>
                            <p className="card-value" style={{ color: '#f59e0b' }}>
                              Rs. {parseFloat(pm.pendingAmount || paymentStats.total_pending_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="card-description">{(pm.pendingCount ?? paymentStats.pending_count) || 0} pending</p>
                          </div>

                          <div className="inventory-card purple">
                            <h3 className="card-title">Average Payment</h3>
                            <p className="card-value" style={{ color: '#8b5cf6' }}>
                              Rs. {parseFloat(pm.avgPayment || paymentStats.avg_payment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="card-description">Per transaction average</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Monthly overview removed per user request */}

                {/* Supplier Performance */}
                <div className="dashboard-section">
                  <h2 className="section-title">Supplier Performance</h2>
                  <div className="supplier-performance-grid">
                    <div className="performance-summary">
                      <div className="inventory-grid">
                        <div className="inventory-card cyan">
                          <h3 className="card-title">Active Suppliers</h3>
                          <p className="card-value" style={{ color: '#06b6d4' }}>
                            {dbStats.totalSuppliers}
                          </p>
                          <p className="card-description">Registered suppliers</p>
                        </div>
                        <div className="inventory-card lime">
                          <h3 className="card-title">Monthly Supplies</h3>
                          <p className="card-value" style={{ color: '#84cc16' }}>
                            {supplyStats.monthlySupplies}
                          </p>
                          <p className="card-description">This month deliveries</p>
                        </div>
                        <div className="inventory-card red">
                          <h3 className="card-title">Payment Success Rate</h3>
                          <p className="card-value" style={{ color: '#ef4444' }}>
                            {paymentStats.total_payments > 0 ? 
                              Math.round((paymentStats.completed_count / paymentStats.total_payments) * 100) : 0}%
                          </p>
                          <p className="card-description">Successful transactions</p>
                        </div>
                      </div>
                    </div>
                    
                    {supplyStats.topSuppliers.length > 0 && (
                      <div className="top-suppliers-card">
                        <h3 className="card-title">Top Suppliers by Value</h3>
                        <div className="supplier-list">
                          {supplyStats.topSuppliers.map((supplier, index) => (
                            <div key={index} className="supplier-item">
                              <div className="supplier-info">
                                <span className="supplier-rank">#{index + 1}</span>
                                <span className="supplier-name">{supplier.name} {supplier.supplier_id ? `- ${supplier.supplier_id}` : ''}</span>
                              </div>
                              <div className="supplier-stats">
                                <span className="supplier-value">
                                  Rs. {supplier.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="supplier-count">{supplier.count} supplies</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Status Overview */}
                <div className="dashboard-section">
                  <h2 className="section-title">Quick Status Overview</h2>
                  <div className="status-overview">
                    <div className="status-item">
                      <div className="status-icon delivered">✓</div>
                      <div className="status-info">
                        <h4>Delivered Orders</h4>
                        <p>{dbStats.deliveredOrders} completed deliveries</p>
                      </div>
                    </div>
                    <div className="status-item">
                      <div className="status-icon pending">⏱</div>
                      <div className="status-info">
                        <h4>Pending Orders</h4>
                        <p>{dbStats.pendingOrders} awaiting payment</p>
                      </div>
                    </div>
                    <div className="status-item">
                      <div className="status-icon efficiency">📊</div>
                      <div className="status-info">
                        <h4>Processing Efficiency</h4>
                        <p>{dbStats.totalOrders > 0 ? Math.round((dbStats.deliveredOrders / dbStats.totalOrders) * 100) : 0}% completion rate</p>
                      </div>
                    </div>
                    <div className="status-item">
                      <div className="status-icon monthly">📅</div>
                      <div className="status-info">
                        <h4>Monthly Activity</h4>
                        <p>{supplyStats.monthlySupplies} supplies this month</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Charts */}
                <DashboardCharts 
                  chartData={chartData}
                  paymentStats={paymentStats}
                  supplyStats={supplyStats}
                />
              </>
            )}
          </div>
        );
      case 'orders':
        // Legacy route: keep fallback but show reports instead of deliveries
        return <StaffReports supplyStats={supplyStats} paymentStats={paymentStats} chartData={chartData} supplyList={supplyList} />;
      case 'reports':
        return <StaffReports supplyStats={supplyStats} paymentStats={paymentStats} chartData={chartData} supplyList={supplyList} />;
      case 'suppliers':
        return <ManageSuppliers />;
      case 'supply-records':
        return <SupplyRecords />;
      case 'payments':
        return <PaymentManagement />;
      default:
        return (
          <div className="default-content">
            <h1 className="default-content-title">{activeContent.charAt(0).toUpperCase() + activeContent.slice(1)}</h1>
            <div className="default-content-card">
              <p className="default-content-text">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="staff-dashboard-container">
      <NavigationBar />
      <div className="staff-dashboard-layout">
        <StaffSidebar 
          dashboardData={dashboardData} 
          activeContent={activeContent}
          setActiveContent={setActiveContent}
        />
        <main className="staff-dashboard-main">
          {renderContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
}