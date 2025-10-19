import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import NavigationBar from '../components/navigationBar';
import SupplierSidebar from '../components/supplierSidebar';
import Footer from '../components/footer';
import Messages from '../components/Messages';
import OrderManagement from '../components/OrderManagement';
import SupplierDashboardCharts from '../components/SupplierDashboardCharts';
import SupplierReports from '../components/SupplierReports';
import { getAuthToken } from '../utils/auth';
import '../styles/SupplierDashboard.css';

export default function SupplierDashboard() {
  const [activeContent, setActiveContent] = useState('dashboard');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supplyList, setSupplyList] = useState([]);
  const [supplyStats, setSupplyStats] = useState({
    totalSupplies: 0,
    totalQuantity: 0,
    totalEarnings: 0,
    avgPrice: 0,
    monthlyAverage: 0,
    completionRate: 0
  });
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0
  });
  const [chartData, setChartData] = useState({
    monthlySupplies: [],
    recentSupplies: [],
    payments: []
  });
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  

  const generateChartData = useCallback((supplies) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlySupplies = [];
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthSupplies = supplies.filter(supply => {
        const supplyDate = new Date(supply.supply_date);
        return supplyDate.getMonth() === monthIndex;
      });
      const quantity = monthSupplies.reduce((sum, s) => sum + (parseFloat(s.quantity_kg) || 0), 0);
      const earnings = monthSupplies.reduce((sum, s) => sum + (parseFloat(s.total_payment) || 0), 0);
      monthlySupplies.push({
        month: monthNames[monthIndex],
        quantity: quantity,
        earnings: earnings,
        supplies: monthSupplies.length
      });
    }

    const recentSupplies = supplies
      .sort((a, b) => new Date(b.supply_date) - new Date(a.supply_date))
      .slice(0, 15)
      .map(supply => ({
        date: new Date(supply.supply_date).toLocaleDateString('en-GB'),
        quantity: parseFloat(supply.quantity_kg) || 0,
        amount: parseFloat(supply.total_payment) || 0,
        status: supply.payment_status === 'paid' ? 'paid' : 'pending'
      }));

    const payments = supplies.map(s => ({ status: s.payment_status === 'paid' ? 'paid' : 'pending' }));

    setChartData({ monthlySupplies, recentSupplies, payments });
  }, []);

  const fetchSupplierData = useCallback(async (supplierId) => {
    try {
      const token = getAuthToken();
      
      // Fetch all supply records from staff API
      const response = await fetch('http://localhost:5000/api/staff/supply-records', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter supply records for the current supplier only
        const allSupplies = Array.isArray(data.data) ? data.data : [];
        const supplies = allSupplies.filter(supply => supply.supplier_id === supplierId);
        
        console.log('Fetched supply records:', {
          totalRecords: allSupplies.length,
          supplierRecords: supplies.length,
          supplierId: supplierId,
          sampleRecord: supplies[0] || 'No records found'
        });
        
        // Store supply list for reports
        setSupplyList(supplies);
        
        // Calculate statistics
        const totalQuantity = supplies.reduce((sum, item) => sum + (parseFloat(item.quantity_kg) || 0), 0);
        const totalEarnings = supplies.reduce((sum, item) => sum + (parseFloat(item.total_payment) || 0), 0);
        const paidSupplies = supplies.filter(s => s.payment_status === 'paid');
        const pendingSupplies = supplies.filter(s => s.payment_status === 'pending' || s.payment_status === 'unpaid');
        const paidAmount = paidSupplies.reduce((sum, item) => sum + (parseFloat(item.total_payment) || 0), 0);
        const pendingAmount = pendingSupplies.reduce((sum, item) => sum + (parseFloat(item.total_payment) || 0), 0);
        
        setSupplyStats({
          totalSupplies: supplies.length,
          totalQuantity: totalQuantity,
          totalEarnings: totalEarnings,
          avgPrice: totalQuantity > 0 ? totalEarnings / totalQuantity : 0,
          monthlyAverage: supplies.length > 0 ? totalQuantity / 12 : 0,
          completionRate: supplies.length > 0 ? (paidSupplies.length / supplies.length) * 100 : 0
        });

        setPaymentStats({
          totalPayments: supplies.length,
          paidAmount: paidAmount,
          pendingAmount: pendingAmount,
          paidCount: paidSupplies.length,
          pendingCount: pendingSupplies.length
        });

  // Generate chart data
  generateChartData(supplies);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch supplier data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }
    } catch (error) {
      console.error('Error fetching supplier data:', {
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  }, [generateChartData]);

  const submitPasswordChange = async () => {
    if (!currentPassword || !newPassword) return toast.error('Please fill both current and new password');
    if (newPassword.length < 6) return toast.error('New password must be >= 6 chars');
    setChangingPassword(true);
    try {
      const token = getAuthToken();
      const stored = JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}');
      const name = stored.name || '';
      const email = stored.email || '';
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword, name, email })
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Password changed successfully');
        // Clear local must_change_password flag for stored user info
        try {
          const data = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
          if (data) {
            const obj = JSON.parse(data);
            obj.must_change_password = 0;
            if (localStorage.getItem('userInfo')) localStorage.setItem('userInfo', JSON.stringify(obj));
            if (sessionStorage.getItem('userInfo')) sessionStorage.setItem('userInfo', JSON.stringify(obj));
          }
        } catch (err) {}
        setForcePasswordChange(false);
      } else {
        toast.error(json.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error', err);
      toast.error('Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  // On mount: load current user info, set supplier id, and fetch data. Also check must_change_password flag.
  useEffect(() => {
    const data = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (data) {
      try {
        const user = JSON.parse(data);
        const id = user.id || user.user_id || user.userId || null;
        if (id) {
          setCurrentUserId(id);
          fetchSupplierData(id);
        }
        if (user.must_change_password === 1 || user.must_change_password === '1' || user.must_change_password === true) {
          setForcePasswordChange(true);
        }
      } catch (e) {
        console.error('Failed to parse userInfo', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [fetchSupplierData]);

  const renderContent = () => {
    switch (activeContent) {
      case 'dashboard':
        return (
          <div className="supplier-dashboard-content">
            <h1 className="supplier-dashboard-title">Supplier Dashboard</h1>
            
            {loading ? (
              <div className="supplier-loading-container">
                <p className="supplier-loading-text">Loading dashboard data...</p>
              </div>
            ) : supplyStats.totalSupplies === 0 ? (
              <div className="supplier-loading-container">
                <p className="supplier-loading-text">No supply records found. Start by creating your first supply delivery.</p>
              </div>
            ) : (
              <>
                {/* Main Metrics */}
                <div className="supplier-dashboard-section">
                  <h2 className="supplier-section-title">Supply Performance Overview</h2>
                  <div className="supplier-metrics-grid">
                    <div className="supplier-metric-card blue">
                      <h3 className="supplier-card-title">Total Supplies</h3>
                      <p className="supplier-card-value" style={{ color: '#3b82f6' }}>
                        {supplyStats.totalSupplies}
                      </p>
                      <p className="supplier-card-description">Supply deliveries recorded</p>
                    </div>
                    <div className="supplier-metric-card green">
                      <h3 className="supplier-card-title">Total Quantity</h3>
                      <p className="supplier-card-value" style={{ color: '#10b981' }}>
                        {supplyStats.totalQuantity.toLocaleString()} kg
                      </p>
                      <p className="supplier-card-description">Tea leaves supplied</p>
                    </div>
                    <div className="supplier-metric-card emerald">
                      <h3 className="supplier-card-title">Total Earnings</h3>
                      <p className="supplier-card-value" style={{ color: '#059669' }}>
                        Rs. {supplyStats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="supplier-card-description">Lifetime earnings</p>
                    </div>
                    <div className="supplier-metric-card purple">
                      <h3 className="supplier-card-title">Average Price</h3>
                      <p className="supplier-card-value" style={{ color: '#8b5cf6' }}>
                        Rs. {supplyStats.avgPrice.toFixed(2)}/kg
                      </p>
                      <p className="supplier-card-description">Per kilogram rate</p>
                    </div>
                  </div>
                </div>

                {/* Payment Statistics */}
                <div className="supplier-dashboard-section">
                  <h2 className="supplier-section-title">Payment Statistics</h2>
                  <div className="supplier-metrics-grid">
                    <div className="supplier-metric-card cyan">
                      <h3 className="supplier-card-title">Total Payments</h3>
                      <p className="supplier-card-value" style={{ color: '#06b6d4' }}>
                        {paymentStats.totalPayments}
                      </p>
                      <p className="supplier-card-description">Payment transactions</p>
                    </div>
                    <div className="supplier-metric-card green">
                      <h3 className="supplier-card-title">Paid Amount</h3>
                      <p className="supplier-card-value" style={{ color: '#10b981' }}>
                        Rs. {paymentStats.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="supplier-card-description">{paymentStats.paidCount} completed payments</p>
                    </div>
                    <div className="supplier-metric-card yellow">
                      <h3 className="supplier-card-title">Pending Amount</h3>
                      <p className="supplier-card-value" style={{ color: '#f59e0b' }}>
                        Rs. {paymentStats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="supplier-card-description">{paymentStats.pendingCount} pending payments</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="supplier-dashboard-section">
                  <h2 className="supplier-section-title">Quick Statistics</h2>
                  <div className="supplier-quick-stats">
                    <div className="supplier-stat-item">
                      <div className="supplier-stat-icon total">📦</div>
                      <div className="supplier-stat-info">
                        <h4>Monthly Average</h4>
                        <p>{supplyStats.monthlyAverage.toFixed(0)} kg</p>
                      </div>
                    </div>
                    <div className="supplier-stat-item">
                      <div className="supplier-stat-icon completed">✓</div>
                      <div className="supplier-stat-info">
                        <h4>Completion Rate</h4>
                        <p>{supplyStats.completionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="supplier-stat-item">
                      <div className="supplier-stat-icon pending">⏱</div>
                      <div className="supplier-stat-info">
                        <h4>Pending Payments</h4>
                        <p>{paymentStats.pendingCount}</p>
                      </div>
                    </div>
                    <div className="supplier-stat-item">
                      <div className="supplier-stat-icon rate">💰</div>
                      <div className="supplier-stat-info">
                        <h4>Payment Success</h4>
                        <p>{paymentStats.totalPayments > 0 ? Math.round((paymentStats.paidCount / paymentStats.totalPayments) * 100) : 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <SupplierDashboardCharts 
                  chartData={chartData}
                  supplyStats={supplyStats}
                  paymentStats={paymentStats}
                />

                {/* Additional Info */}
                <div className="supplier-dashboard-section">
                  <div className="supplier-info-card">
                    <h3 className="supplier-info-title">Supply Summary</h3>
                    <div className="supplier-info-content">
                      <ul className="supplier-info-list">
                        <li>
                          <span className="supplier-info-label">Total Tea Supplied:</span>
                          <span className="supplier-info-value">{supplyStats.totalQuantity.toLocaleString()} kg</span>
                        </li>
                        <li>
                          <span className="supplier-info-label">Total Earnings:</span>
                          <span className="supplier-info-value">Rs. {supplyStats.totalEarnings.toLocaleString()}</span>
                        </li>
                        <li>
                          <span className="supplier-info-label">Average Rate:</span>
                          <span className="supplier-info-value">Rs. {supplyStats.avgPrice.toFixed(2)}/kg</span>
                        </li>
                        <li>
                          <span className="supplier-info-label">Payment Success Rate:</span>
                          <span className="supplier-info-value">{supplyStats.completionRate.toFixed(1)}%</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'messages':
        return currentUserId ? <Messages userRole="supplier" userId={currentUserId} /> : <div>Loading...</div>;
      case 'orders':
        return <OrderManagement />;
      case 'reports':
        return <SupplierReports 
          supplyStats={supplyStats} 
          paymentStats={paymentStats} 
          chartData={chartData} 
          supplyList={supplyList} 
        />;
      case 'change-password':
        return (
          <div style={{ padding: 24 }}>
            <h2>Change Password</h2>
            <p>Please change the temporary password you received by email. You will not be able to use the temporary password again.</p>
              <div style={{ maxWidth: 520, marginTop: 12 }}>
              <label>Current password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(s => !s)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <label style={{ marginTop: 12 }}>New password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(s => !s)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveContent('dashboard')} style={{ padding: '8px 12px' }}>Cancel</button>
                <button onClick={async () => {
                  await submitPasswordChange();
                  // after success, navigate to dashboard
                  setActiveContent('dashboard');
                }} style={{ padding: '8px 12px', background: '#059669', color: '#fff' }}>{changingPassword ? 'Saving...' : 'Change Password'}</button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>{activeContent.charAt(0).toUpperCase() + activeContent.slice(1)}</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ color: '#6b7280' }}>This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="supplier-dashboard-container">
      {/* Force change password modal */}
      {forcePasswordChange && (
        <div className="force-password-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 520, background: '#fff', padding: 24, borderRadius: 8 }}>
            <h3>Change your temporary password</h3>
            <p>For security, please change the temporary password you received by email before continuing.</p>
            <div style={{ marginTop: 12 }}>
              <label>Current password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                <button type="button" onClick={() => setShowCurrentPassword(s => !s)} aria-label="Toggle current password visibility" style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label>New password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                <button type="button" onClick={() => setShowNewPassword(s => !s)} aria-label="Toggle new password visibility" style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => {}} disabled={changingPassword} style={{ padding: '8px 12px' }}>Cancel</button>
              <button onClick={submitPasswordChange} disabled={changingPassword} style={{ padding: '8px 12px', background: '#059669', color: '#fff', borderRadius: 6 }}>{changingPassword ? 'Saving...' : 'Change Password'}</button>
            </div>
          </div>
        </div>
      )}
      <NavigationBar />
  <Toaster />
      <div className="supplier-dashboard-layout">
        <SupplierSidebar 
          dashboardData={{
            totalOrders: supplyStats.totalSupplies,
            pendingOrders: paymentStats.pendingCount,
            totalProducts: supplyStats.totalQuantity,
            inventoryLevel: supplyStats.completionRate,
            deliveryRate: supplyStats.completionRate
          }} 
          activeContent={activeContent}
          setActiveContent={setActiveContent}
        />
        <main className="supplier-dashboard-main">
          {renderContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
}