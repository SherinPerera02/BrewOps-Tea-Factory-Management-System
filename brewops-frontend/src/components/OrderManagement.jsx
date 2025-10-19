import React, { useState, useEffect } from 'react';
import { getCurrentUserId } from '../utils/auth';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    tea_type: '',
    grade: '',
    quantity_kg: '',
    supplier_id: '',
    price_per_kg: '',
    payment_method: 'spot',
    payment_status: 'unpaid'
  });
  const [formErrors, setFormErrors] = useState({});

  const grades = ['PEKOE', 'OP', 'BOP', 'FBOP', 'DUST', 'FANNINGS'];
  const itemsPerPage = 10;

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, filterGrade, sortBy, sortOrder]);

  // Fetch suppliers for dropdown
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/manager/suppliers');
      
      if (response.ok) {
        const result = await response.json();
        setSuppliers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Fetch orders data with filters and pagination
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        grade: filterGrade,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const response = await fetch(`/api/supplier/orders?${params}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrders(result.data.orders || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
        } else {
          setError(result.message || 'Failed to fetch orders');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.tea_type.trim()) {
      errors.tea_type = 'Tea type is required';
    } else if (formData.tea_type.length > 255) {
      errors.tea_type = 'Tea type must be less than 255 characters';
    }
    
    if (!formData.grade) {
      errors.grade = 'Grade is required';
    }
    
    const quantity = parseFloat(formData.quantity_kg);
    if (!formData.quantity_kg || isNaN(quantity) || quantity <= 0) {
      errors.quantity_kg = 'Quantity must be a positive number';
    } else if (quantity > 999999.99) {
      errors.quantity_kg = 'Quantity cannot exceed 999,999.99 kg';
    }
    
    const price = parseFloat(formData.price_per_kg);
    if (!formData.price_per_kg || isNaN(price) || price <= 0) {
      errors.price_per_kg = 'Price must be a positive number';
    } else if (price > 999999.99) {
      errors.price_per_kg = 'Price cannot exceed 999,999.99';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Add current supplier ID to form data
      const currentUserId = getCurrentUserId();
      const orderData = {
        ...formData,
        supplier_id: currentUserId
      };
      
      const url = editingOrder 
        ? `/api/supplier/orders/${editingOrder.id}`
        : '/api/supplier/orders';
      
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess(result.message || (editingOrder ? 'Order updated successfully!' : 'Order created successfully!'));
        await fetchOrders();
        resetForm();
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          setError(result.errors.join(', '));
        } else {
          setError(result.message || 'Error saving order');
        }
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Network error while saving order');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (id, teaType) => {
    if (!window.confirm(`Are you sure you want to delete order for "${teaType}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/supplier/orders/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess(result.message || 'Order deleted successfully!');
        await fetchOrders();
      } else {
        setError(result.message || 'Error deleting order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Network error while deleting order');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      tea_type: order.tea_type || '',
      grade: order.grade || '',
      quantity_kg: order.quantity_kg || '',
      supplier_id: order.supplier_id || '',
      price_per_kg: order.price_per_kg || '',
      payment_method: order.payment_method || 'spot',
      payment_status: order.payment_status || 'unpaid'
    });
    setFormErrors({});
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      tea_type: '',
      grade: '',
      quantity_kg: '',
      supplier_id: '',
      price_per_kg: '',
      payment_method: 'spot',
      payment_status: 'unpaid'
    });
    setFormErrors({});
    setEditingOrder(null);
    setShowForm(false);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterGrade(e.target.value);
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Styles
  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    filtersContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    inputError: {
      borderColor: '#ef4444'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    errorText: {
      color: '#ef4444',
      fontSize: '12px',
      marginTop: '4px'
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '500'
    },
    errorAlert: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    successAlert: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '32px',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    modalHeader: {
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e2e8f0'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      paddingTop: '16px',
      borderTop: '2px solid #e2e8f0'
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0'
    },
    tableHeaderCell: {
      padding: '16px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background-color 0.2s'
    },
    tableCell: {
      padding: '16px',
      color: '#374151',
      borderBottom: '1px solid #e2e8f0'
    },
    tableRow: {
      transition: 'background-color 0.2s'
    },
    tableRowHover: {
      backgroundColor: '#f8fafc'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#6b7280'
    },
    loadingState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#6b7280'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      padding: '20px',
      backgroundColor: 'white',
      borderTop: '1px solid #e2e8f0'
    },
    pageButton: {
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      color: '#374151',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      minWidth: '40px'
    },
    activePageButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6'
    },
    sortIcon: {
      marginLeft: '4px',
      fontSize: '12px'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Raw Tea Leaves Order Management</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{...styles.button, ...styles.primaryButton}}
          disabled={loading}
        >
          + Add New Raw Tea Order
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{...styles.alert, ...styles.errorAlert}}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{...styles.alert, ...styles.successAlert}}>
          {success}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div>
          <label style={styles.label}>Search</label>
          <input
            type="text"
            placeholder="Search by tea type..."
            value={searchTerm}
            onChange={handleSearch}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Filter by Grade</label>
          <select
            value={filterGrade}
            onChange={handleFilterChange}
            style={styles.select}
          >
            <option value="">All Grades</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingOrder ? 'Edit Raw Tea Order' : 'Add New Raw Tea Order'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Tea Type *</label>
                  <input
                    type="text"
                    name="tea_type"
                    value={formData.tea_type}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      ...(formErrors.tea_type ? styles.inputError : {})
                    }}
                    placeholder="Enter tea type"
                    required
                  />
                  {formErrors.tea_type && (
                    <div style={styles.errorText}>{formErrors.tea_type}</div>
                  )}
                </div>

                <div>
                  <label style={styles.label}>Grade *</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    style={{
                      ...styles.select,
                      ...(formErrors.grade ? styles.inputError : {})
                    }}
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  {formErrors.grade && (
                    <div style={styles.errorText}>{formErrors.grade}</div>
                  )}
                </div>

                <div>
                  <label style={styles.label}>Quantity (KG) *</label>
                  <input
                    type="number"
                    name="quantity_kg"
                    value={formData.quantity_kg}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      ...(formErrors.quantity_kg ? styles.inputError : {})
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                  {formErrors.quantity_kg && (
                    <div style={styles.errorText}>{formErrors.quantity_kg}</div>
                  )}
                </div>

                <div>
                  <label style={styles.label}>Price per KG *</label>
                  <input
                    type="number"
                    name="price_per_kg"
                    value={formData.price_per_kg}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      ...(formErrors.price_per_kg ? styles.inputError : {})
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                  {formErrors.price_per_kg && (
                    <div style={styles.errorText}>{formErrors.price_per_kg}</div>
                  )}
                </div>

                <div>
                  <label style={styles.label}>Payment Method *</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      ...(formErrors.payment_method ? styles.inputError : {})
                    }}
                    required
                  >
                    <option value="spot">Spot Payment</option>
                    <option value="monthly">Monthly Payment</option>
                  </select>
                  {formErrors.payment_method && (
                    <div style={styles.errorText}>{formErrors.payment_method}</div>
                  )}
                </div>

                <div>
                  <label style={styles.label}>Payment Status *</label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      ...(formErrors.payment_status ? styles.inputError : {})
                    }}
                    required
                  >
                    <option value="unpaid">Not Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                  {formErrors.payment_status && (
                    <div style={styles.errorText}>{formErrors.payment_status}</div>
                  )}
                </div>
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{...styles.button, ...styles.secondaryButton}}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.button,
                    ...styles.successButton,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : (editingOrder ? 'Update' : 'Add')} Raw Tea Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div style={styles.tableContainer}>
        {loading && !showForm ? (
          <div style={styles.loadingState}>
            <p>Loading raw tea orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No raw tea orders found.</p>
            <p>Add your first raw tea order to get started.</p>
          </div>
        ) : (
          <>
            <div style={{overflow: 'auto'}}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('tea_type')}
                    >
                      Tea Type
                      {sortBy === 'tea_type' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('grade')}
                    >
                      Grade
                      {sortBy === 'grade' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('quantity_kg')}
                    >
                      Quantity (KG)
                      {sortBy === 'quantity_kg' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('price_per_kg')}
                    >
                      Price per KG
                      {sortBy === 'price_per_kg' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                    >
                      Total Value
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('payment_method')}
                    >
                      Payment Method
                      {sortBy === 'payment_method' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('payment_status')}
                    >
                      Payment Status
                      {sortBy === 'payment_status' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      style={styles.tableHeaderCell}
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {sortBy === 'created_at' && (
                        <span style={styles.sortIcon}>
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      style={styles.tableRow}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.tableRowHover.backgroundColor}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={styles.tableCell}>
                        <div style={{fontWeight: '500'}}>{order.tea_type}</div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {order.grade}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {parseFloat(order.quantity_kg).toLocaleString()} kg
                      </td>
                      <td style={styles.tableCell}>
                        {formatCurrency(order.price_per_kg)}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{fontWeight: '600', color: '#059669'}}>
                          {formatCurrency(order.quantity_kg * order.price_per_kg)}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: order.payment_method === 'spot' ? '#dbeafe' : '#fef3c7',
                          color: order.payment_method === 'spot' ? '#1e40af' : '#92400e',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {order.payment_method === 'spot' ? 'Spot Payment' : 'Monthly Payment'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: order.payment_status === 'paid' ? '#d1fae5' : '#fee2e2',
                          color: order.payment_status === 'paid' ? '#065f46' : '#991b1b',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {order.payment_status === 'paid' ? 'Paid' : 'Not Paid'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleEdit(order)}
                            style={{
                              ...styles.actionButton,
                              backgroundColor: order.payment_status === 'paid' ? '#9ca3af' : '#3b82f6',
                              color: 'white',
                              cursor: order.payment_status === 'paid' ? 'not-allowed' : 'pointer'
                            }}
                            disabled={loading || order.payment_status === 'paid'}
                            title={order.payment_status === 'paid' ? 'Paid orders cannot be edited' : 'Edit order'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(order.id, order.tea_type)}
                            style={{
                              ...styles.actionButton,
                              backgroundColor: order.payment_status === 'paid' ? '#9ca3af' : '#ef4444',
                              color: 'white',
                              cursor: order.payment_status === 'paid' ? 'not-allowed' : 'pointer'
                            }}
                            disabled={loading || order.payment_status === 'paid'}
                            title={order.payment_status === 'paid' ? 'Paid orders cannot be deleted' : 'Delete order'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.pageButton,
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      ...styles.pageButton,
                      ...(currentPage === page ? styles.activePageButton : {})
                    }}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.pageButton,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;