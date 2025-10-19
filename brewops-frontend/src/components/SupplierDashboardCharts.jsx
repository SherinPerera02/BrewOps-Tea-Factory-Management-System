import React, { useState } from 'react';
import './DashboardCharts.css';

const SupplierDashboardCharts = ({ chartData, supplyStats, paymentStats }) => {
  // Pagination state for charts
  const [monthlyDisplayCount, setMonthlyDisplayCount] = useState(10);
  const [suppliesDisplayCount, setSuppliesDisplayCount] = useState(10);
  
  // Monthly Supply History Chart
  const MonthlySupplyChart = () => {
    const displayedMonths = chartData.monthlySupplies.slice(0, monthlyDisplayCount);
    const maxQuantity = Math.max(...displayedMonths.map(d => d.quantity));
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">My Monthly Supply History</h3>
        <div className="line-chart">
          <div className="chart-grid">
            {displayedMonths.map((data, index) => (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar supply-bar"
                  style={{ 
                    height: `${(data.quantity / maxQuantity) * 100}%`,
                    backgroundColor: '#10b981'
                  }}
                  title={`${data.quantity} kg`}
                ></div>
                <div className="chart-label">{data.month}</div>
                <div className="chart-value">{data.quantity.toFixed(0)} kg</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#10b981'}}></span>
              Tea Leaves Supplied (kg)
            </span>
          </div>
        </div>
        
        {/* Show More/Less Button */}
        {chartData.monthlySupplies.length > 10 && (
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => {
                if (monthlyDisplayCount >= chartData.monthlySupplies.length) {
                  setMonthlyDisplayCount(10);
                } else {
                  setMonthlyDisplayCount(prev => Math.min(prev + 10, chartData.monthlySupplies.length));
                }
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#10b981';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
            >
              {monthlyDisplayCount >= chartData.monthlySupplies.length 
                ? 'Show Less' 
                : `Show More (${chartData.monthlySupplies.length - monthlyDisplayCount} remaining)`
              }
            </button>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
              Showing {monthlyDisplayCount} of {chartData.monthlySupplies.length} months
            </p>
          </div>
        )}
      </div>
    );
  };

  // Payment Status Chart
  const PaymentStatusChart = () => {
    const total = chartData.payments.length;
    const completed = chartData.payments.filter(p => p.status === 'paid').length;
    const pending = chartData.payments.filter(p => p.status === 'pending').length;
    const completedPercentage = total > 0 ? (completed / total) * 100 : 0;
    const pendingPercentage = total > 0 ? (pending / total) * 100 : 0;
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Payment Status Overview</h3>
        <div className="donut-chart-container">
          <div className="donut-chart">
            <div className="donut-inner">
              <span className="donut-total">{total}</span>
              <span className="donut-label">Total</span>
            </div>
            <svg width="200" height="200" className="donut-svg">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${completedPercentage * 5.02} 502`}
                strokeDashoffset="125.5"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray={`${pendingPercentage * 5.02} 502`}
                strokeDashoffset={`${125.5 - (completedPercentage * 5.02)}`}
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>
          <div className="donut-legend">
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#10b981'}}></span>
              <span>Paid: {completed} ({completedPercentage.toFixed(1)}%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#f59e0b'}}></span>
              <span>Pending: {pending} ({pendingPercentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Recent Supplies List
  const RecentSuppliesChart = () => {
    const displayedSupplies = chartData.recentSupplies.slice(0, suppliesDisplayCount);
    const maxAmount = Math.max(...displayedSupplies.map(s => s.amount));
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Recent Supply Records</h3>
        <div className="supplier-chart">
          {displayedSupplies.map((supply, index) => (
            <div key={index} className="supplier-bar-container">
              <div className="supplier-info">
                <span className="supplier-name">{supply.date} - {supply.quantity} kg</span>
                <span className="supplier-value">Rs. {supply.amount.toLocaleString()}</span>
              </div>
              <div className="supplier-bar-background">
                <div 
                  className="supplier-bar-fill"
                  style={{ 
                    width: `${(supply.amount / maxAmount) * 100}%`,
                    backgroundColor: supply.status === 'paid' ? '#10b981' : '#f59e0b'
                  }}
                ></div>
              </div>
              <div className="supplier-count">
                {supply.status === 'paid' ? '✓ Paid' : '⏱ Pending Payment'}
              </div>
            </div>
          ))}
        </div>
        
        {/* Show More/Less Button */}
        {chartData.recentSupplies.length > 10 && (
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => {
                if (suppliesDisplayCount >= chartData.recentSupplies.length) {
                  setSuppliesDisplayCount(10);
                } else {
                  setSuppliesDisplayCount(prev => Math.min(prev + 10, chartData.recentSupplies.length));
                }
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
            >
              {suppliesDisplayCount >= chartData.recentSupplies.length 
                ? 'Show Less' 
                : `Show More (${chartData.recentSupplies.length - suppliesDisplayCount} remaining)`
              }
            </button>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
              Showing {suppliesDisplayCount} of {chartData.recentSupplies.length} supplies
            </p>
          </div>
        )}
      </div>
    );
  };

  // Monthly Earnings Chart
  const MonthlyEarningsChart = () => {
    const maxEarnings = Math.max(...chartData.monthlySupplies.map(d => d.earnings));
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Monthly Earnings</h3>
        <div className="horizontal-chart">
          {chartData.monthlySupplies.slice(0, 6).map((month, index) => (
            <div key={index} className="progress-bar-container">
              <div className="progress-label">
                <span>{month.month}</span>
                <span>Rs. {month.earnings.toLocaleString()}</span>
              </div>
              <div className="progress-bar-background">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${(month.earnings / maxEarnings) * 100}%`,
                    backgroundColor: `hsl(${140 + (index * 20)}, 70%, 50%)`
                  }}
                ></div>
              </div>
              <div className="progress-value">{month.quantity.toFixed(0)} kg supplied</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        <div className="chart-row">
          <MonthlySupplyChart />
          <PaymentStatusChart />
        </div>
        <div className="chart-row">
          <MonthlyEarningsChart />
          <RecentSuppliesChart />
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboardCharts;
