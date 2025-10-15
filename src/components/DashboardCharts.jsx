import React, { useState } from 'react';
import './DashboardCharts.css';

const DashboardCharts = ({ chartData, paymentStats, supplyStats }) => {
  // Pagination state for charts
  const [monthlyDisplayCount, setMonthlyDisplayCount] = useState(10);
  const [weeklyDisplayCount, setWeeklyDisplayCount] = useState(10);
  const [suppliersDisplayCount, setSuppliersDisplayCount] = useState(10);
  
  // Monthly Trends Line Chart
  const MonthlyTrendsChart = () => {
    const displayedMonths = chartData.monthlyTrends.slice(0, monthlyDisplayCount);
    const maxValue = Math.max(...displayedMonths.map(d => d.value));
    const maxSupplies = Math.max(...displayedMonths.map(d => d.supplies));
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Monthly Supply Trends</h3>
        <div className="line-chart">
          <div className="chart-grid">
            {displayedMonths.map((data, index) => (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar supply-bar"
                  style={{ 
                    height: `${(data.supplies / maxSupplies) * 100}%`,
                    backgroundColor: '#3b82f6'
                  }}
                  title={`${data.supplies} supplies`}
                ></div>
                <div className="chart-label">{data.month}</div>
                <div className="chart-value">{data.supplies}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#3b82f6'}}></span>
              Supply Count
            </span>
          </div>
        </div>
        
        {/* Show More/Less Button */}
        {chartData.monthlyTrends.length > 10 && (
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => {
                if (monthlyDisplayCount >= chartData.monthlyTrends.length) {
                  setMonthlyDisplayCount(10);
                } else {
                  setMonthlyDisplayCount(prev => Math.min(prev + 10, chartData.monthlyTrends.length));
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
              {monthlyDisplayCount >= chartData.monthlyTrends.length 
                ? 'Show Less' 
                : `Show More (${chartData.monthlyTrends.length - monthlyDisplayCount} remaining)`
              }
            </button>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
              Showing {monthlyDisplayCount} of {chartData.monthlyTrends.length} months
            </p>
          </div>
        )}
      </div>
    );
  };

  // Payment Methods Pie Chart (CSS-based)
  const PaymentMethodsChart = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const total = chartData.paymentMethods.reduce((sum, method) => sum + method.count, 0);
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Payment Methods Distribution</h3>
        <div className="pie-chart-container">
          <div className="pie-chart">
            {chartData.paymentMethods.map((method, index) => {
              const percentage = (method.count / total) * 100;
              return (
                <div 
                  key={index}
                  className="pie-segment"
                  style={{
                    background: `conic-gradient(${colors[index % colors.length]} ${percentage}%, transparent ${percentage}%)`
                  }}
                  title={`${method.method}: ${method.count} (${percentage.toFixed(1)}%)`}
                ></div>
              );
            })}
          </div>
          <div className="pie-chart-legend">
            {chartData.paymentMethods.map((method, index) => (
              <div key={index} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{backgroundColor: colors[index % colors.length]}}
                ></span>
                <span className="legend-text">
                  {method.method}: {method.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Weekly Supply Progress Chart
  const WeeklySuppliesChart = () => {
    const displayedWeeks = chartData.weeklySupplies.slice(0, weeklyDisplayCount);
    const maxQuantity = Math.max(...displayedWeeks.map(d => d.quantity));
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Weekly Supply Quantity</h3>
        <div className="horizontal-chart">
          {displayedWeeks.map((week, index) => (
            <div key={index} className="progress-bar-container">
              <div className="progress-label">
                <span>{week.week}</span>
                <span>{week.quantity.toFixed(0)} kg</span>
              </div>
              <div className="progress-bar-background">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${(week.quantity / maxQuantity) * 100}%`,
                    backgroundColor: `hsl(${120 + (index * 30)}, 60%, 50%)`
                  }}
                ></div>
              </div>
              <div className="progress-value">{week.supplies} supplies</div>
            </div>
          ))}
        </div>
        
        {/* Show More/Less Button */}
        {chartData.weeklySupplies.length > 10 && (
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => {
                if (weeklyDisplayCount >= chartData.weeklySupplies.length) {
                  setWeeklyDisplayCount(10);
                } else {
                  setWeeklyDisplayCount(prev => Math.min(prev + 10, chartData.weeklySupplies.length));
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
              {weeklyDisplayCount >= chartData.weeklySupplies.length 
                ? 'Show Less' 
                : `Show More (${chartData.weeklySupplies.length - weeklyDisplayCount} remaining)`
              }
            </button>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
              Showing {weeklyDisplayCount} of {chartData.weeklySupplies.length} weeks
            </p>
          </div>
        )}
      </div>
    );
  };

  // Top Suppliers Chart
  const TopSuppliersChart = () => {
    const displayedSuppliers = chartData.supplierPerformance.slice(0, suppliersDisplayCount);
    const maxValue = displayedSuppliers.length > 0 ? 
      Math.max(...displayedSuppliers.map(s => s.totalValue)) : 1;
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">Top Suppliers Performance</h3>
        <div className="supplier-chart">
          {displayedSuppliers.map((supplier, index) => (
            <div key={index} className="supplier-bar-container">
              <div className="supplier-info">
                <span className="supplier-name">{supplier.name}</span>
                <span className="supplier-value">Rs. {supplier.totalValue.toLocaleString()}</span>
              </div>
              <div className="supplier-bar-background">
                <div 
                  className="supplier-bar-fill"
                  style={{ 
                    width: `${(supplier.totalValue / maxValue) * 100}%`,
                    backgroundColor: `hsl(${200 + (index * 40)}, 70%, 50%)`
                  }}
                ></div>
              </div>
              <div className="supplier-count">{supplier.count} supplies</div>
            </div>
          ))}
        </div>
        
        {/* Show More/Less Button */}
        {chartData.supplierPerformance.length > 10 && (
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => {
                if (suppliersDisplayCount >= chartData.supplierPerformance.length) {
                  setSuppliersDisplayCount(10);
                } else {
                  setSuppliersDisplayCount(prev => Math.min(prev + 10, chartData.supplierPerformance.length));
                }
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d97706';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
              }}
            >
              {suppliersDisplayCount >= chartData.supplierPerformance.length 
                ? 'Show Less' 
                : `Show More (${chartData.supplierPerformance.length - suppliersDisplayCount} remaining)`
              }
            </button>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
              Showing {suppliersDisplayCount} of {chartData.supplierPerformance.length} suppliers
            </p>
          </div>
        )}
      </div>
    );
  };

  // Payment Status Donut Chart
  const PaymentStatusChart = () => {
    const total = (paymentStats.completed_count || 0) + (paymentStats.pending_count || 0) + (paymentStats.failed_count || 0);
    const completedPercentage = total > 0 ? (paymentStats.completed_count / total) * 100 : 0;
    const pendingPercentage = total > 0 ? (paymentStats.pending_count / total) * 100 : 0;
    const failedPercentage = total > 0 ? (paymentStats.failed_count / total) * 100 : 0;
    
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
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeDasharray={`${failedPercentage * 5.02} 502`}
                strokeDashoffset={`${125.5 - (completedPercentage * 5.02) - (pendingPercentage * 5.02)}`}
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>
          <div className="donut-legend">
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#10b981'}}></span>
              <span>Completed: {paymentStats.completed_count || 0}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#f59e0b'}}></span>
              <span>Pending: {paymentStats.pending_count || 0}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: '#ef4444'}}></span>
              <span>Failed: {paymentStats.failed_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        <div className="chart-row">
          <MonthlyTrendsChart />
          <PaymentMethodsChart />
        </div>
        <div className="chart-row">
          <WeeklySuppliesChart />
          <PaymentStatusChart />
        </div>
        <div className="chart-full-width">
          <TopSuppliersChart />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;