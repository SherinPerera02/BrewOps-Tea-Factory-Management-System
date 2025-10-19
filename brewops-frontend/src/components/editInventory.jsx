import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import './createInventory.css';

const EditInventory = () => {
  const [inventoryId, setInventoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [quantityTouched, setQuantityTouched] = useState(false);
  const validateTimer = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const quantityRef = useRef(null);

  useEffect(() => {
    setLoading(true);

    // Get JWT token for manager authentication
    const token = localStorage.getItem('jwtToken');

    // Use manager endpoint for consistency
    axios.get(`/api/manager/inventory/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        const data = res.data.data || {};
        setInventoryId(data.inventoryid || '');
        setQuantity(data.quantity ?? '');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        toast.error('Failed to fetch inventory.');
      });
  }, [id]);

  // focus the quantity input when the modal is displayed and loading has finished
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        quantityRef.current?.focus();
      }, 0);
    }
  }, [loading]);

  // Client-side validation for quantity with debounce; validate after pause or on blur
  const validateQuantity = (value) => {
    if (value === '' || value === null) {
      setQuantityError('Quantity is required');
      return;
    }
    const q = parseInt(value);
    if (isNaN(q) || q <= 0) {
      setQuantityError('Quantity must be a positive number');
    } else if (q > 999999) {
      setQuantityError('Quantity cannot exceed 999999');
    } else {
      setQuantityError('');
    }
  };

  useEffect(() => {
    // Don't validate until the field has been touched at least once
    if (!quantityTouched) return;

    // Clear previous timer
    if (validateTimer.current) clearTimeout(validateTimer.current);

    // Debounce validation to allow easy editing
    validateTimer.current = setTimeout(() => {
      validateQuantity(quantity);
    }, 600);

    return () => {
      if (validateTimer.current) clearTimeout(validateTimer.current);
    };
  }, [quantity, quantityTouched]);

  const handleUpdate = () => {
    const qty = parseInt(quantity);
    const updatedData = {
      inventoryid: inventoryId,
      quantity: qty,
      quantity_kg: qty,
    };
    setLoading(true);

    // Get JWT token for manager authentication
    const token = localStorage.getItem('jwtToken');
    
    // PUT to manager route (delegates to controller)
    axios.put(`/api/manager/inventory/${id}`, updatedData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        setLoading(false);
        toast.success('Inventory updated successfully');
        // Navigate back to dashboard and force reload to refresh list
        setTimeout(() => {
          navigate('/production-manager-dashboard');
          setTimeout(() => { try { window.location.replace('/production-manager-dashboard'); } catch (e) { window.location.href = '/production-manager-dashboard'; } }, 50);
        }, 400);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        toast.error('Failed to update inventory.');
      });
  };

  return (
    <div className="ci-root">
      {/* Modal backdrop */}
      <div className="ci-backdrop" onClick={() => navigate('/production-manager-dashboard')}>
        <div className="ci-modal" onClick={(e) => e.stopPropagation()}>
          <h1 className="ci-title">Edit Inventory</h1>

          {loading && <Spinner />}

          {!loading && (
            <div className="ci-form">
              <div className="ci-field">
                <label className="ci-label">Inventory Number</label>
                <input
                  type="text"
                  value={inventoryId || ''}
                  disabled
                  className="ci-input"
                />
                <p className="ci-note">Inventory ID cannot be modified to maintain traceability</p>
              </div>

              <div className="ci-field">
                <label className="ci-label">Quantity (kg)</label>
                <input
                  type="number"
                  ref={quantityRef}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setQuantityTouched(true);
                  }}
                  onBlur={() => {
                    setQuantityTouched(true);
                    validateQuantity(quantity);
                  }}
                  min="1"
                  max="999999"
                  className={`ci-input ${quantityError ? 'ci-input-error' : ''}`}
                />
                {quantityError && <div className="ci-error">{quantityError}</div>}
              </div>

              <div className="ci-actions">
                <button
                  className="ci-btn ci-btn-primary"
                  onClick={handleUpdate}
                  disabled={loading || !!quantityError}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="ci-btn ci-btn-cancel" onClick={() => navigate('/production-manager-dashboard')}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default EditInventory;