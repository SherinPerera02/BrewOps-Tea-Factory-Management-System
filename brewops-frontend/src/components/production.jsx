import React, { useState, useEffect } from 'react';
import { FaLeaf, FaCogs } from 'react-icons/fa';
import { MdOutlineAddBox } from 'react-icons/md';
import toast from 'react-hot-toast';
import './inventoryManagement.css';

const Production = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalQuantity, setModalQuantity] = useState('');
  const [preGeneratedProductionId, setPreGeneratedProductionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // Test toast to verify system is working
    setTimeout(() => {
  
    }, 1000);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Fetch inventory data
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
      console.log('Fetched inventory data:', inventoryResult.data);
      console.log('Total inventory:', inventoryResult.data?.reduce((sum, item) => sum + (item.quantity || 0), 0));
      if (inventoryResult.success) {
        setInventoryData(inventoryResult.data || []);
      }

      // Fetch production data
      const productionResponse = await fetch('http://localhost:5000/api/manager/production', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!productionResponse.ok) {
        throw new Error('Failed to fetch production data');
      }

      const productionResult = await productionResponse.json();
      if (productionResult.success) {
        setProductionData(productionResult.data || []);
        setVisibleCount(10);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduction = () => {
    // pre-generate production id when opening modal
    const pad = (n) => n.toString().padStart(2, '0');
    const now = new Date();
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    // include a short random suffix to avoid collisions in UI
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generated = `PROD-${year}${month}${day}-${hours}${minutes}-${suffix}`;
    setPreGeneratedProductionId(generated);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalQuantity('');
    setPreGeneratedProductionId('');
  };

  const handleSubmitProduction = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // send only quantity and the client-side pre-generated production id
      const todayDate = new Date().toISOString().split('T')[0];
      const response = await fetch('http://localhost:5000/api/manager/production', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: parseFloat(modalQuantity),
          production_id: preGeneratedProductionId,
          production_date: todayDate
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh both inventory and production data
        await fetchData();
        handleModalClose();
        
        const inventoryInfo = result.data?.remainingInventory !== undefined 
          ? ` | Inventory deducted: ${result.data.inventoryDeducted} kg | Remaining: ${result.data.remainingInventory} kg`
          : '';
        
        toast.success(`Production added! ID: ${result.data?.production_id || 'N/A'}, Quantity: ${result.data?.quantity || 0} kg${inventoryInfo}`, {
          duration: 6000,
          icon: ''
        });
      } else {
        toast.error(`Failed to add production: ${result.message || 'Unknown error'}`, {
          duration: 4000,
          icon: ''
        });
      }
    } catch (error) {
      console.error('Error adding production:', error);
      toast.error('Network error: Unable to add production record. Please check your connection.', {
        duration: 5000,
        icon: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaCogs style={{ color: '#3b82f6' }} />
          Production Management
        </h1>
        <button
          onClick={handleAddProduction}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            gap: '8px'
          }}
        >
          <MdOutlineAddBox style={{ fontSize: '18px' }} />
          Add Production
        </button>
      </div>
      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px', 
          padding: '12px', 
          marginBottom: '24px',
          color: '#dc2626'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchData}
            style={{ 
              marginLeft: '12px', 
              padding: '4px 8px', 
              backgroundColor: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Production Overview */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            minWidth: '250px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <FaLeaf style={{ color: '#10b981', fontSize: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Available Raw Materials</h3>
            </div>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {loading ? '...' : `${inventoryData?.reduce((total, item) => total + (item.quantity || 0), 0) || 0} kg`}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Tea leaves in stock</p>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            minWidth: '250px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <FaCogs style={{ color: '#3b82f6', fontSize: '24px' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Total Production</h3>
            </div>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
              {loading ? '...' : `${productionData?.reduce((total, item) => total + (parseFloat(item.quantity) || 0), 0) || 0} kg`}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Total produced ({productionData?.length || 0} records)</p>
          </div>
        </div>
      </div>
      {/* Production Records */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>Production Records</h2>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1f2937' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Production ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity (kg)</th>
              </tr>
            </thead>
            <tbody>
              {productionData?.length > 0 ? productionData.slice(0, visibleCount).map((record, index) => (
                <tr key={record.id} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{index + 1}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>{record.production_id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{record.production_date}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{record.production_time || (record.created_at ? new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>{record.quantity} kg</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    {loading ? 'Loading production records...' : 'No production records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {productionData.length > visibleCount && (
          <div className="show-more-container">
            <button
              onClick={() => setVisibleCount((c) => Math.min(c + 10, productionData.length))}
              className="im-btn im-btn-primary show-more-btn"
            >
              Show more
            </button>
          </div>
        )}
      </div>

      {/* Add Production Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
              Add Production Record
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Quantity (kg) *
              </label>
              <input
                type="number"
                value={modalQuantity}
                onChange={(e) => setModalQuantity(e.target.value)}
                placeholder="Enter quantity in kg"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                min="1"
                step="0.1"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Production ID
              </label>
              <input
                type="text"
                value={preGeneratedProductionId}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleModalClose}
                disabled={submitting}
                style={{
                  padding: '12px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProduction}
                disabled={!modalQuantity || parseFloat(modalQuantity) <= 0 || submitting}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: (!modalQuantity || parseFloat(modalQuantity) <= 0 || submitting) ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!modalQuantity || parseFloat(modalQuantity) <= 0 || submitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Adding...' : 'Add Production'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
