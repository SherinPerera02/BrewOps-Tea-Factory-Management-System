import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSort, FaEye, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import '../styles/StaffOrders.css';

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters and pagination
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [notes, setNotes] = useState('');

  const teaGrades = ['PEKOE', 'OP', 'BOP', 'FBOP', 'GBOP', 'TGFOP', 'FTGFOP', 'SFTGFOP'];
  const orderStatuses = ['pending', 'delivered'];

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
  }, [search, gradeFilter, statusFilter, sortBy, sortOrder, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search,
        grade: gradeFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/staff/orders?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
        setPagination(data.pagination || {});
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !statusUpdate) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/staff/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusUpdate,
          notes: notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Order status updated successfully');
        setShowModal(false);
        setSelectedOrder(null);
        setStatusUpdate('');
        setNotes('');
        fetchOrders(); // Refresh the orders list
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    if (!window.confirm('Are you sure you want to mark this order as paid?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/staff/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: 'paid'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Order marked as paid successfully');
        fetchOrders(); // Refresh the orders list
      } else {
        setError(data.message || 'Failed to mark order as paid');
      }
    } catch (error) {
      console.error('Mark as paid error:', error);
      setError('Failed to mark order as paid');
    } finally {
      setLoading(false);
    }
  };


  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusUpdate(order.status);
    setNotes(order.notes || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setStatusUpdate('');
    setNotes('');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      received: '#059669',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="staff-orders-container">
      <div className="staff-orders-header">
        <h1 className="staff-orders-title">
          Supplier Orders
        </h1>
        <p className="staff-orders-subtitle">
          View and manage supplier orders. Mark orders as received when they arrive.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="message-error">
          {error}
        </div>
      )}

      {success && (
        <div className="message-success">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">
              Search
            </label>
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tea type or supplier..."
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              Grade
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Grades</option>
              {teaGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              {orderStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="filter-select"
            >
              <option value="order_date-desc">Order Date (Newest)</option>
              <option value="order_date-asc">Order Date (Oldest)</option>
              <option value="delivery_date-desc">Delivery Date (Latest)</option>
              <option value="delivery_date-asc">Delivery Date (Earliest)</option>
              <option value="tea_type-asc">Tea Type (A-Z)</option>
              <option value="tea_type-desc">Tea Type (Z-A)</option>
              <option value="quantity_kg-desc">Quantity (High-Low)</option>
              <option value="quantity_kg-asc">Quantity (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        {loading ? (
          <div className="loading-container">
            <FaSpinner className="loading-spinner" />
            <p className="loading-text">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders-container">
            <p className="no-orders-text">No orders found</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="orders-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Order ID</th>
                    <th className="table-header-cell">Tea Type</th>
                    <th className="table-header-cell">Grade</th>
                    <th className="table-header-cell">Quantity (kg)</th>
                    <th className="table-header-cell">Supplier</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Payment Method</th>
                    <th className="table-header-cell">Payment Status</th>
                    <th className="table-header-cell">Order Date</th>
                    <th className="table-header-cell">Delivery Date</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell">#{order.id}</td>
                      <td className="table-cell bold">{order.tea_type}</td>
                      <td className="table-cell">{order.grade}</td>
                      <td className="table-cell">{order.quantity_kg.toLocaleString()}</td>
                      <td className="table-cell">{order.supplier_name || 'Unknown'}</td>
                      <td className="table-cell">
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status)
                          }}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span 
                          className="payment-method-badge"
                          style={{
                            backgroundColor: order.payment_method === 'spot' ? '#10b98120' : '#f59e0b20',
                            color: order.payment_method === 'spot' ? '#10b981' : '#f59e0b',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {order.payment_method || 'spot'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span 
                          className="payment-status-badge"
                          style={{
                            backgroundColor: order.payment_status === 'paid' ? '#10b98120' : '#ef444420',
                            color: order.payment_status === 'paid' ? '#10b981' : '#ef4444',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {order.payment_status === 'paid' ? 'Paid' : 'Not Paid'}
                        </span>
                      </td>
                      <td className="table-cell muted">{formatDate(order.order_date)}</td>
                      <td className="table-cell muted">
                        {order.delivery_date ? formatDate(order.delivery_date) : 'TBD'}
                      </td>
                      <td className="table-cell">
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openStatusModal(order)}
                            className="action-button"
                          >
                            <FaEye size={12} />
                            Update Status
                          </button>
                          {order.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(order.id)}
                              className="action-button"
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white'
                              }}
                            >
                              <FaCheck size={12} />
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalOrders)} of {pagination.totalOrders} orders
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrev}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  <span className="pagination-current">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={!pagination.hasNext}
                    className="pagination-button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Update Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Update Order Status</h3>

            {selectedOrder && (
              <div className="order-details">
                <p><strong>Order ID:</strong> #{selectedOrder.id}</p>
                <p><strong>Tea Type:</strong> {selectedOrder.tea_type}</p>
                <p><strong>Grade:</strong> {selectedOrder.grade}</p>
                <p><strong>Quantity:</strong> {selectedOrder.quantity_kg} kg</p>
                <p><strong>Supplier:</strong> {selectedOrder.supplier_name}</p>
                <p><strong>Current Status:</strong> 
                  <span 
                    className="current-status-badge"
                    style={{
                      backgroundColor: `${getStatusColor(selectedOrder.status)}20`,
                      color: getStatusColor(selectedOrder.status)
                    }}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Status</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="form-select"
              >
                {orderStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status update..."
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={closeModal}
                className="modal-button-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading || !statusUpdate}
                className="modal-button-submit"
              >
                {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheck />}
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffOrders;