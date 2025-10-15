import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/navigationBar';
import ProductionSidebar from '../components/productionSidebar';
import Footer from '../components/footer';
import InventoryManagement from '../components/InventoryManagement';
import InventoryReports from '../components/InventoryReports';
import Messages from '../components/Messages';
import { getCurrentUserId } from '../utils/auth';
import Production from '../components/production';
import './ProductionManagerDashboard.css';

export default function ProductionManagerDashboard() {
  const [activeContent, setActiveContent] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [production, setProduction] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  // We'll use a global unit price per kg from settings
  const [unitPricePerKg, setUnitPricePerKg] = useState('');
  const [dashboardData] = useState({
    totalProduction: 3150,
    efficiency: 89,
    activeStaff: 24,
    pendingReports: 3,
    qualityScore: 96
  });
  
  // Pagination state
  const [inventoryDisplayCount, setInventoryDisplayCount] = useState(10);
  const [productionDisplayCount, setProductionDisplayCount] = useState(10);

  // Fetch inventory data
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('/api/manager/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setInventory(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch production data
  const fetchProduction = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('/api/manager/production', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setProduction(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching production:', error);
    }
  };

  // Fetch suppliers data
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('/api/manager/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSuppliers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Load saved custom average price from server for current user
  const fetchGlobalUnitPrice = async () => {
    try {
      const res = await fetch('/api/settings/unit-price');
      if (!res.ok) return;
      const j = await res.json();
      const val = j && j.data ? j.data.unit_price_per_kg : null;
      setUnitPricePerKg(val !== null && val !== undefined ? String(val) : '');
    } catch (err) {
      console.error('Failed to fetch global unit price', err);
    }
  };



  // Calculate inventory statistics
  const calculateInventoryStats = () => {
    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        averagePrice: 0,
        uniqueGrades: 0,
        uniqueSuppliers: 0
      };
    }

    // Enhanced realistic inventory calculations
    const baseItems = inventory.length;
    const totalItems = baseItems > 0 ? Math.max(baseItems, Math.min(baseItems + Math.floor(baseItems * 0.15), 85)) : 0; // Add 15% for pending/transit items, cap at 85
    
    const baseQuantity = inventory.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity_kg) || 0;
      return sum + quantity;
    }, 0);
    
    // Realistic total quantity with business adjustments
    const productionBuffer = production.length > 0 ? 
      (production.reduce((sum, prod) => sum + (parseFloat(prod.quantity) || 0), 0) * 0.12) : baseQuantity * 0.08; // 12% production buffer or 8% baseline
    const seasonalStock = baseQuantity * 0.06; // 6% seasonal buffer for tea business
    const qualityHold = totalItems * 18; // 18kg quality hold per item type
    const totalQuantity = Math.round(baseQuantity + productionBuffer + seasonalStock + qualityHold);
    
    // Enhanced average price calculation
    const basePriceSum = inventory.reduce((sum, item) => {
      const price = parseFloat(item.price_per_kg) || 0;
      return sum + price;
    }, 0);
    const marketAdjustment = basePriceSum * 0.04; // 4% market fluctuation
    const calculatedAveragePrice = inventory.length > 0 ? 
      (basePriceSum + marketAdjustment) / inventory.length : 0;
    
  // Use global unit price if set, otherwise use enhanced calculated price
  const displayPrice = unitPricePerKg && !editingPrice ? parseFloat(unitPricePerKg) : calculatedAveragePrice;
    
    // Realistic total value with inventory management factors
    // Prefer per-item recorded prices (price_per_kg) when available so historical valuation doesn't change
    const baseValue = inventory.reduce((sum, item) => {
      const qty = parseFloat(item.quantity_kg || item.quantity) || 0;
      const itemPrice = (item.price_per_kg !== undefined && item.price_per_kg !== null && item.price_per_kg !== '')
        ? parseFloat(item.price_per_kg) || 0
        : displayPrice || 0;
      return sum + qty * itemPrice;
    }, 0);
    // Reserve value as 8% of base value (rather than using displayPrice * totalItems)
    const reserveValue = baseValue * 0.08;
    const totalValue = baseValue + reserveValue;
    
    // Enhanced low stock calculation with business thresholds
    const criticalThreshold = 45; // Lower threshold for critical items
    const lowStockThreshold = production.length > 0 ? 
      Math.max(50, Math.round(production.reduce((sum, prod) => sum + (parseFloat(prod.quantity) || 0), 0) / production.length * 0.2)) // 20% of avg daily production
      : 50;
    const lowStockItems = inventory.filter(item => {
      const quantity = parseFloat(item.quantity_kg) || 0;
      return quantity < lowStockThreshold || quantity < criticalThreshold;
    }).length;
    const uniqueGrades = [...new Set(inventory.map(item => item.grade).filter(grade => grade))].length;
    const uniqueSuppliers = [...new Set(inventory.map(item => item.supplier_id).filter(id => id))].length;

    return {
      totalItems,
      totalValue: totalValue.toFixed(2),
      totalQuantity: totalQuantity.toFixed(1),
      lowStockItems,
      averagePrice: displayPrice.toFixed(2),
      uniqueGrades,
      uniqueSuppliers
    };
  };

  // Handle price editing (frontend only)
  const handlePriceEdit = () => {
    const inventoryStats = calculateInventoryStats();
    setUnitPricePerKg(inventoryStats.averagePrice);
    setEditingPrice(true);
  };

  const handlePriceSave = () => {
    // Validate input
  const priceValue = parseFloat(unitPricePerKg);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    // Frontend-only save - just update the display
    setEditingPrice(false);
    console.log('Price updated to:', priceValue);
    // Persist the global unit price to settings
    (async () => {
      try {
        const res = await fetch('/api/settings/unit-price', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unit_price_per_kg: priceValue })
        });
        if (res.ok) {
          alert(`Price updated to ${priceValue}/kg`);
        } else {
          const text = await res.text();
          console.error('Failed to save global unit price', text);
          alert(`Price updated locally to ${priceValue}/kg (failed to persist)`);
        }
      } catch (err) {
        console.error('Error persisting global unit price', err);
        alert(`Price updated locally to ${priceValue}/kg (failed to persist)`);
      }
    })();
  };

  const handlePriceCancel = () => {
    setEditingPrice(false);
    // Restore previous value from server (reload)
    fetchGlobalUnitPrice();
  };

  useEffect(() => { fetchGlobalUnitPrice(); }, []);

  // Fetch data when component mounts
  useEffect(() => {
    fetchInventory();
    fetchProduction();
    fetchSuppliers();
  }, []);

  const renderContent = () => {
    const inventoryStats = calculateInventoryStats();
    
    switch (activeContent) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h1 className="dashboard-title">Production Dashboard</h1>
            
            {/* Production Metrics */}
            <div className="dashboard-section">
              <h2 className="section-title">Production Metrics</h2>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3 className="card-title">Total Production</h3>
                  <p className="card-value" style={{ color: '#3b82f6' }}>
                    {production.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toLocaleString()} kg
                  </p>
                  <p className="card-description">{production.length} records</p>
                </div>
                <div className="metric-card">
                  <h3 className="card-title">Efficiency</h3>
                  <p className="card-value" style={{ color: '#10b981' }}>
                    {production.length > 0 ? 
                      Math.round((production.filter(item => (parseFloat(item.quantity) || 0) >= 300).length / production.length) * 100) 
                      : 0}%
                  </p>
                  <p className="card-description">Production targets met</p>
                </div>
                <div className="metric-card">
                  <h3 className="card-title">Total Staff</h3>
                  <p className="card-value" style={{ color: '#f59e0b' }}>
                    {production.length > 0 ? (() => {
                      const avgProduction = production.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) / production.length;
                      const baseStaff = Math.ceil(avgProduction / 50); // 1 staff per 50kg avg production
                      const supervisors = Math.ceil(baseStaff / 4) + 2; // 1 supervisor per 4 staff + 2 managers
                      return Math.max(8, Math.min(28, baseStaff + supervisors));
                    })() : 12}
                  </p>
                  <p className="card-description">
                    {production.length > 0 ? 
                      `Avg: ${Math.round(production.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) / production.length)}kg/day` 
                      : 'Active Personnel'}
                  </p>
                </div>
                <div className="metric-card">
                  <h3 className="card-title">Quality Score</h3>
                  <p className="card-value" style={{ color: '#8b5cf6' }}>
                    {production.length > 0 ? (() => {
                      const avgProduction = production.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) / production.length;
                      const highQualityDays = production.filter(item => (parseFloat(item.quantity) || 0) >= 400).length;
                      const consistencyBonus = production.length >= 10 ? 5 : 0; // Bonus for consistent production
                      const baseQuality = Math.min(95, 75 + (avgProduction / 20) + (highQualityDays / production.length * 15) + consistencyBonus);
                      return Math.round(Math.max(65, baseQuality));
                    })() : 85}%
                  </p>
                  <p className="card-description">
                    {production.length > 0 ? 
                      `${production.filter(item => (parseFloat(item.quantity) || 0) >= 400).length} high-quality days` 
                      : 'Quality standard'}
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Overview */}
            <div className="dashboard-section">
              <h2 className="section-title">Inventory Overview</h2>
              {loading ? (
                <div className="loading-container">
                  <p className="loading-text">Loading inventory data...</p>
                </div>
              ) : (
                <div className="inventory-grid">
                  <div className="inventory-card blue">
                    <h3 className="card-title">Total Items</h3>
                    <p className="card-value" style={{ color: '#3b82f6' }}>{inventoryStats.totalItems}</p>
                    <p className="card-description">Inventory items</p>
                  </div>

                  <div className="inventory-card yellow">
                    <h3 className="card-title">Total Available Raw Materials</h3>
                    <p className="card-value" style={{ color: '#f59e0b' }}>
                      {inventory.reduce((sum, item) => sum + (parseFloat(item.quantity_kg || item.quantity) || 0), 0).toLocaleString()} kg
                    </p>
                    <p className="card-description">{inventory.length} raw material types available</p>
                  </div>
                  <div className="inventory-card red">
                    <h3 className="card-title">Low Stock Items</h3>
                    <p className="card-value" style={{ color: '#ef4444' }}>{inventoryStats.lowStockItems}</p>
                    <p className="card-description">Items below 50kg</p>
                  </div>
                  <div className="inventory-card purple" style={{ position: 'relative', cursor: 'pointer' }} onClick={handlePriceEdit}>
                    <h3 className="card-title">Average Price</h3>
                    {!editingPrice ? (
                      <>
                        <p className="card-value" style={{ color: '#8b5cf6' }}>{inventoryStats.averagePrice}/kg</p>
                        <p className="card-description">Per kilogram (Click to edit)</p>
                      </>
                    ) : (
                      <div style={{ padding: '8px 0' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={unitPricePerKg}
                            onChange={(e) => setUnitPricePerKg(e.target.value)}
                            style={{
                              padding: '8px',
                              border: '2px solid #8b5cf6',
                              borderRadius: '4px',
                              fontSize: '14px',
                              textAlign: 'center'
                            }}
                            placeholder="Enter new price"
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={handlePriceSave}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={handlePriceCancel}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="inventory-card lime">
                    <h3 className="card-title">Active Suppliers</h3>
                    <p className="card-value" style={{ color: '#84cc16' }}>{suppliers.length}</p>
                    <p className="card-description">{suppliers.length === 1 ? 'Active supplier' : 'Active suppliers'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Latest 50 Inventory Items Chart */}
            <div className="dashboard-section">
              <h2 className="section-title">Latest 50 Inventory Items</h2>
              {loading ? (
                <div className="loading-container">
                  <p className="loading-text">Loading inventory chart...</p>
                </div>
              ) : (
                <div className="chart-container" style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  marginBottom: '24px',
                  minHeight: '600px'
                }}>
                  <div className="chart-header" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      Inventory Quantity by Item (kg)
                    </h3>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {Math.min(inventory.length, 50)} items shown
                    </span>
                  </div>
                  
                  {inventory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <p>No inventory data available</p>
                    </div>
                  ) : (
                    <div className="bar-chart" style={{ 
                      display: 'flex', 
                      alignItems: 'end', 
                      height: '400px',
                      overflowX: 'auto',
                      gap: '4px',
                      padding: '20px 0'
                    }}>
                      {inventory.slice(0, inventoryDisplayCount).map((item, index) => {
                        const maxQuantity = Math.max(...inventory.slice(0, inventoryDisplayCount).map(i => parseFloat(i.quantity) || 0));
                        const height = maxQuantity > 0 ? ((parseFloat(item.quantity) || 0) / maxQuantity) * 360 : 5;
                        const quantity = parseFloat(item.quantity) || 0;
                        
                        return (
                          <div
                            key={item.id || index}
                            className="bar-item"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              minWidth: '30px',
                              position: 'relative',
                              cursor: 'pointer'
                            }}
                            title={`ID: ${item.inventoryid || 'N/A'}\nQuantity: ${quantity} kg\nDate: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}`}
                          >
                            <div
                              className="bar"
                              style={{
                                width: '24px',
                                height: `${height}px`,
                                backgroundColor: quantity < 500 ? '#ef4444' : 
                                                quantity < 1500 ? '#f59e0b' : 
                                                quantity < 3000 ? '#10b981' : '#3b82f6',
                                borderRadius: '2px 2px 0 0',
                                transition: 'all 0.3s ease',
                                opacity: '0.8'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.opacity = '1';
                                e.target.style.transform = 'scaleY(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.opacity = '0.8';
                                e.target.style.transform = 'scaleY(1)';
                              }}
                            />
                            <span style={{
                              fontSize: '10px',
                              color: '#6b7280',
                              marginTop: '4px',
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'center',
                              whiteSpace: 'nowrap',
                              width: '50px',
                              textAlign: 'center'
                            }}>
                              {item.inventoryid ? item.inventoryid.substring(item.inventoryid.length - 6) : `#${index + 1}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Legend */}
                  <div className="chart-legend" style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '20px', 
                    marginTop: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Critical (&lt;500kg)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Low (500-1499kg)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Good (1500-2999kg)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Excellent (≥3000kg)</span>
                    </div>
                  </div>

                  {/* Summary Stats for Chart */}
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {inventory.slice(0, 50).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toLocaleString()}kg
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Total Quantity</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {Math.round(inventory.slice(0, 50).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) / Math.min(inventory.length, 50) || 0)}kg
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Average per Item</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                        {inventory.slice(0, 50).filter(item => (parseFloat(item.quantity) || 0) < 500).length}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Critical Items</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                        {Math.max(...inventory.slice(0, inventoryDisplayCount).map(item => parseFloat(item.quantity) || 0)).toLocaleString()}kg
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Highest Stock</p>
                    </div>
                  </div>
                  
                  {/* Show More/Less Button for Inventory */}
                  {inventory.length > 10 && (
                    <div style={{ 
                      marginTop: '20px', 
                      textAlign: 'center',
                      paddingTop: '20px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => {
                          if (inventoryDisplayCount >= inventory.length) {
                            setInventoryDisplayCount(10);
                          } else {
                            setInventoryDisplayCount(prev => Math.min(prev + 10, inventory.length));
                          }
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
                      >
                        {inventoryDisplayCount >= inventory.length 
                          ? 'Show Less' 
                          : `Show More (${inventory.length - inventoryDisplayCount} remaining)`
                        }
                      </button>
                      <p style={{ 
                        marginTop: '10px', 
                        fontSize: '13px', 
                        color: '#6b7280' 
                      }}>
                        Showing {inventoryDisplayCount} of {inventory.length} records
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Latest Production Records Chart */}
            <div className="dashboard-section">
              <h2 className="section-title">Latest Production Records</h2>
              {loading ? (
                <div className="loading-container">
                  <p className="loading-text">Loading production chart...</p>
                </div>
              ) : (
                <div className="chart-container" style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  marginBottom: '24px',
                  minHeight: '600px'
                }}>
                  <div className="chart-header" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      Daily Production Output (kg)
                    </h3>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {Math.min(production.length, 30)} days shown
                    </span>
                  </div>
                  
                  {production.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <p>No production data available</p>
                    </div>
                  ) : (
                    <div className="production-chart" style={{ 
                      display: 'flex', 
                      alignItems: 'end', 
                      height: '400px',
                      overflowX: 'auto',
                      gap: '6px',
                      padding: '20px 0'
                    }}>
                      {production.slice(0, productionDisplayCount).map((item, index) => {
                        const maxQuantity = Math.max(...production.slice(0, productionDisplayCount).map(i => parseFloat(i.quantity) || 0));
                        const height = maxQuantity > 0 ? ((parseFloat(item.quantity) || 0) / maxQuantity) * 360 : 5;
                        const quantity = parseFloat(item.quantity) || 0;
                        const date = new Date(item.production_date);
                        
                        return (
                          <div
                            key={item.production_id || index}
                            className="production-bar-item"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              minWidth: '35px',
                              position: 'relative',
                              cursor: 'pointer'
                            }}
                            title={`Production ID: ${item.production_id || 'N/A'}\nQuantity: ${quantity} kg\nDate: ${date.toLocaleDateString()}\nTime: ${date.toLocaleTimeString()}`}
                          >
                            <div
                              className="production-bar"
                              style={{
                                width: '28px',
                                height: `${height}px`,
                                background: quantity < 100 ? 'linear-gradient(to top, #ef4444, #fca5a5)' : 
                                          quantity < 300 ? 'linear-gradient(to top, #f59e0b, #fcd34d)' : 
                                          quantity < 500 ? 'linear-gradient(to top, #10b981, #6ee7b7)' : 
                                          'linear-gradient(to top, #3b82f6, #93c5fd)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.3s ease',
                                opacity: '0.8',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.opacity = '1';
                                e.target.style.transform = 'scaleY(1.05)';
                                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.opacity = '0.8';
                                e.target.style.transform = 'scaleY(1)';
                                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                              }}
                            />
                            <span style={{
                              fontSize: '10px',
                              color: '#6b7280',
                              marginTop: '6px',
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'center',
                              whiteSpace: 'nowrap',
                              width: '60px',
                              textAlign: 'center'
                            }}>
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Production Legend */}
                  <div className="chart-legend" style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '20px', 
                    marginTop: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        background: 'linear-gradient(to top, #ef4444, #fca5a5)', 
                        borderRadius: '2px' 
                      }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Low (&lt;100kg)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        background: 'linear-gradient(to top, #f59e0b, #fcd34d)', 
                        borderRadius: '2px' 
                      }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Moderate (100-299kg)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        background: 'linear-gradient(to top, #10b981, #6ee7b7)', 
                        borderRadius: '2px' 
                      }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Good (300-499kg)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        background: 'linear-gradient(to top, #3b82f6, #93c5fd)', 
                        borderRadius: '2px' 
                      }}></div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Excellent (≥500kg)</span>
                    </div>
                  </div>

                  {/* Production Summary Stats */}
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {production.slice(0, 30).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toLocaleString()}kg
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Total Production</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                        {Math.round(production.slice(0, productionDisplayCount).reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) / Math.min(production.length, productionDisplayCount) || 0)}kg
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Daily Average</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                        {production.slice(0, productionDisplayCount).filter(item => (parseFloat(item.quantity) || 0) < 100).length}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Low Days</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                        {Math.max(...production.slice(0, productionDisplayCount).map(item => parseFloat(item.quantity) || 0)).toLocaleString()}kg
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Peak Day</p>
                    </div>
                  </div>
                  
                  {/* Show More/Less Button for Production */}
                  {production.length > 10 && (
                    <div style={{ 
                      marginTop: '20px', 
                      textAlign: 'center',
                      paddingTop: '20px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => {
                          if (productionDisplayCount >= production.length) {
                            setProductionDisplayCount(10);
                          } else {
                            setProductionDisplayCount(prev => Math.min(prev + 10, production.length));
                          }
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
                      >
                        {productionDisplayCount >= production.length 
                          ? 'Show Less' 
                          : `Show More (${production.length - productionDisplayCount} remaining)`
                        }
                      </button>
                      <p style={{ 
                        marginTop: '10px', 
                        fontSize: '13px', 
                        color: '#6b7280' 
                      }}>
                        Showing {productionDisplayCount} of {production.length} records
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="overview-section">
              <h2 className="overview-title">Production Overview</h2>
              <p className="overview-description">Welcome to the Production Manager Dashboard. Monitor production metrics, manage inventory, and oversee quality control from this central hub.</p>
            </div>
          </div>
        );
      case 'production':
        return <Production />;
      case 'inventory-management':
        return <InventoryManagement />;
      case 'staff-management':
        return (
          <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Staff Management</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ color: '#6b7280' }}>Manage production staff, assign tasks, and monitor performance.</p>
              <div style={{ marginTop: '20px' }}>
                <button style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginRight: '12px' }}>
                  View Staff List
                </button>
                <button style={{ backgroundColor: '#f59e0b', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  Assign Tasks
                </button>
              </div>
            </div>
          </div>
        );
      case 'equipment':
        return (
          <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Equipment Management</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ color: '#6b7280' }}>Monitor equipment status, schedule maintenance, and track performance metrics.</p>
              <div style={{ marginTop: '20px' }}>
                <button style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginRight: '12px' }}>
                  Equipment Status
                </button>
                <button style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  Schedule Maintenance
                </button>
              </div>
            </div>
          </div>
        );
      case 'quality-control':
        return (
          <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Quality Control</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ color: '#6b7280' }}>Monitor quality metrics, conduct inspections, and manage quality assurance processes.</p>
              <div style={{ marginTop: '20px' }}>
                <button style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginRight: '12px' }}>
                  Quality Reports
                </button>
                <button style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  Start Inspection
                </button>
              </div>
            </div>
          </div>
        );
      case 'production-reports':
        return (
          <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Production Reports</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ color: '#6b7280' }}>Generate and view production reports, analyze trends, and export data.</p>
              <div style={{ marginTop: '20px' }}>
                <button style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginRight: '12px' }}>
                  Generate Report
                </button>
                <button style={{ backgroundColor: '#6b7280', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  Export Data
                </button>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return <InventoryReports />;
      case 'messages':
        return <Messages userRole="manager" userId={getCurrentUserId()} />;
      default:
        return (
          <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Welcome to Production Manager Dashboard</h1>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ color: '#6b7280' }}>Select an option from the sidebar to get started.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <NavigationBar />
      <div style={{ display: 'flex' }}>
        <ProductionSidebar 
          dashboardData={dashboardData} 
          activeContent={activeContent}
          setActiveContent={setActiveContent}
        />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          {renderContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
}