import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import './createInventory.css';

const ShowInventory = () => {
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      console.error('No ID provided for fetching inventory.');
      return;
    }

    setLoading(true);
    // Use manager route for consistency with other manager endpoints
    axios.get(`/api/manager/inventory/${id}`)
      .then((response) => {
        setInventory(response.data.data || {});
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching inventory:', error);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="ci-root">
      {/* Modal backdrop - clicking backdrop returns to Production Manager Dashboard */}
      <div className="ci-backdrop" onClick={() => navigate('/production-manager-dashboard')}>
        <div className="ci-modal" onClick={(e) => e.stopPropagation()}>
          <h1 className="ci-title">Inventory Details</h1>

          {loading ? (
            <Spinner />
          ) : (
            <div className="ci-form">
              <div className="ci-field">
                <label className="ci-label">Inventory Number</label>
                <input
                  type="text"
                  value={inventory.inventoryid || ''}
                  disabled
                  className="ci-input"
                />
                <p className="ci-note">Auto-generated inventory identifier</p>
              </div>

              <div className="ci-field">
                <label className="ci-label">Quantity (kg)</label>
                <input
                  type="text"
                  value={inventory.quantity ?? ''}
                  disabled
                  className="ci-input"
                />
                <p className="ci-note">Quantity in kilograms</p>
              </div>

              <div className="ci-field">
                <label className="ci-label">Created At</label>
                <input
                  type="text"
                  value={inventory.createdAt ? new Date(inventory.createdAt).toLocaleString() : 'N/A'}
                  disabled
                  className="ci-input"
                />
              </div>

              <div className="ci-field">
                <label className="ci-label">Updated At</label>
                <input
                  type="text"
                  value={inventory.updatedAt ? new Date(inventory.updatedAt).toLocaleString() : 'N/A'}
                  disabled
                  className="ci-input"
                />
              </div>

              <div className="ci-actions">
                <button className="ci-btn ci-btn-cancel" onClick={() => navigate('/production-manager-dashboard')}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowInventory;
