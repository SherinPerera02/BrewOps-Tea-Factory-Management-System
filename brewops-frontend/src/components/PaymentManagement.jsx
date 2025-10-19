import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaUniversity, FaCreditCard, FaIdCard, FaCodeBranch, FaCode, FaEye, FaSearch, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Spinner from './Spinner';
import '../styles/PaymentManagement.css';

const PaymentManagement = () => {
  const navigate = useNavigate();
  const [supplyRecords, setSupplyRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'pending', 'history', 'statistics'
  

  useEffect(() => {
    fetchSupplyRecords();
    fetchPaymentHistory();
    fetchPaymentStatistics();
    
  }, []);

  useEffect(() => {
    filterRecords();
  }, [supplyRecords, searchTerm, filterStatus]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm]);

  const fetchSupplyRecords = async () => {
    try {
      setLoading(true);
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || 
                    localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/staff/supply-records', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Extract the data array from the API response
        const records = Array.isArray(result.data) ? result.data : [];
        setSupplyRecords(records);
        console.log('Supply records loaded:', records);
      } else {
        toast.error('Failed to fetch supply records');
        setSupplyRecords([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching supply records:', error);
      toast.error('Error loading supply records');
      setSupplyRecords([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    // Ensure supplyRecords is an array before filtering
    if (!Array.isArray(supplyRecords)) {
      setFilteredRecords([]);
      return;
    }

    let filtered = [...supplyRecords];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.supply_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by payment status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.payment_status === filterStatus);
    }

    setFilteredRecords(filtered);
  };

  const fetchPaymentHistory = async () => {
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || 
                    localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payment/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const paymentHistory = Array.isArray(result.data) ? result.data : [];
        setPayments(paymentHistory);
        console.log('Payment history loaded:', paymentHistory);
      } else {
        toast.error('Failed to fetch payment history');
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Error loading payment history');
      setPayments([]);
    }
  };

  const fetchPaymentStatistics = async () => {
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || 
                    localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payment/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentStats(result.data || {});
        console.log('Payment statistics loaded:', result.data);
      } else {
        toast.error('Failed to fetch payment statistics');
      }
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      toast.error('Error loading payment statistics');
    }
  };

  const filterPayments = () => {
    if (!Array.isArray(payments)) {
      setFilteredPayments([]);
      return;
    }

    let filtered = [...payments];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.supply_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const fetchPaymentData = async (recordId) => {
    try {
      setProcessing(true);
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || 
                    localStorage.getItem('token') || sessionStorage.getItem('token');

      // Fetch supply record details
      const supplyResponse = await fetch(`http://localhost:5000/api/staff/supply-records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!supplyResponse.ok) {
        throw new Error('Failed to fetch supply record');
      }

      const supplyResult = await supplyResponse.json();
      const supplyData = supplyResult.data || supplyResult;

      // Fetch supplier bank information
      const supplierResponse = await fetch(`http://localhost:5000/api/users/${supplyData.supplier_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!supplierResponse.ok) {
        throw new Error('Failed to fetch supplier information');
      }

      const supplierResult = await supplierResponse.json();
      const supplierData = supplierResult.data || supplierResult;

      setPaymentData({
        supply_record: supplyData,
        supplier: supplierData
      });

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewPayment = (record) => {
    // Navigate to the payment page with the record ID
    navigate(`/payment/${record.id}`);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedRecord) return;

    try {
      setProcessing(true);
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || 
                    localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/staff/supply-records/${selectedRecord.id}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_status: 'paid' })
      });

      if (response.ok) {
        toast.success('Payment marked as completed successfully!');
        setShowPaymentModal(false);
        fetchSupplyRecords(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentGateway = async () => {
    if (!paymentData?.supply_record || !paymentData?.supplier) {
      toast.error('Payment data not available');
      return;
    }

    try {
      setProcessing(true);
      
      const paymentRequestData = {
        amount: paymentData.supply_record.total_payment,
        currency: 'LKR',
        description: `Payment for Supply ID: ${paymentData.supply_record.supply_id}`,
        supplier_name: paymentData.supplier.name,
        supplier_email: paymentData.supplier.email,
        supply_record_id: selectedRecord.id
      };

      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || 
                    localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payment/gateway', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequestData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.payment_url) {
          // Redirect to payment gateway
          window.open(result.payment_url, '_blank');
          toast.success('Redirecting to payment gateway...');
        } else {
          toast.error('Failed to initialize payment gateway');
        }
      } else {
        // For demo purposes, simulate payment gateway
        const confirmed = window.confirm(
          `Redirect to Payment Gateway?\n\n` +
          `Amount: Rs. ${paymentData.supply_record.total_payment}\n` +
          `Supplier: ${paymentData.supplier.name}\n` +
          `Supply ID: ${paymentData.supply_record.supply_id}\n\n` +
          `Click OK to proceed to payment gateway (Demo)`
        );
        
        if (confirmed) {
          toast.success('Redirecting to payment gateway...');
          setTimeout(() => {
            handleMarkAsPaid();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Payment gateway error:', error);
      toast.error('Failed to initialize payment gateway');
    } finally {
      setProcessing(false);
    }
  };



  const getPaymentMethodBadgeClass = (method) => {
    switch (method?.toLowerCase()) {
      case 'monthly': return 'monthly';
      case 'spot': return 'spot';
      default: return 'default';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case 'monthly': return 'text-blue-600 bg-blue-100';
      case 'spot': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedRecord(null);
    setPaymentData(null);
  };

  if (loading) {
    return (
      <div className="payment-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="payment-management-container">
      <div>
        <h1>Payment Management</h1>
        <p>Manage supplier payments and process transactions</p>
      </div>

      {/* Tab Navigation */}
      <div className="payment-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments ({filteredRecords.filter(r => r.payment_status === 'unpaid').length})
        </button>
        {/* Removed Payment History Tab */}
        <button 
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="payment-search-controls">
        <div className="payment-search-input">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by supplier name or supply ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="payment-filter-select">
          <FaFilter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <>
          {/* Payment Records Table */}
          <div className="payment-table-container">
            <div style={{overflowX: 'auto'}}>
          <table className="payment-table">
            <thead>
              <tr>
                <th>Supply Details</th>
                <th>Supplier</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(filteredRecords) || filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="payment-empty">
                    {loading ? 'Loading payment records...' : 'No payment records found'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div style={{fontSize: '0.875rem', fontWeight: '500', color: '#1f2937'}}>
                        {record.supply_id}
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        {new Date(record.supply_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize: '0.875rem', fontWeight: '500', color: '#1f2937'}}>
                        {record.supplier_name}
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize: '0.875rem', fontWeight: '500', color: '#1f2937'}}>
                        Rs. {record.total_payment?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`payment-method-badge ${getPaymentMethodBadgeClass(record.payment_method)}`}>
                        {record.payment_method || 'Not specified'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${record.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                        {record.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewPayment(record)}
                        className="action-button"
                      >
                        <FaEye style={{marginRight: '0.25rem'}} />
                        View Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            </div>
          </div>
        </>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="payment-statistics">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Payments</h3>
              <p className="stat-value">{paymentStats.total_payments ?? 0}</p>
            </div>
            <div className="stat-card">
              <h3>Completed Amount</h3>
              <p className="stat-value">Rs. {parseFloat(paymentStats.total_completed_amount ?? 0).toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Amount</h3>
              <p className="stat-value">Rs. {parseFloat(paymentStats.total_pending_amount ?? 0).toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Count</h3>
              <p className="stat-value">{paymentStats.pending_count ?? 0}</p>
            </div>
            
           
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h2 className="payment-modal-title">Payment Details</h2>
              <button
                onClick={closeModal}
                className="payment-modal-close"
              >
                <svg style={{width: '1.5rem', height: '1.5rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="payment-modal-content">
              {processing && !paymentData ? (
                <div className="payment-loading">
                  <Spinner />
                  <span>Loading payment information...</span>
                </div>
              ) : paymentData ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  {/* Supply Record Information */}
                  <div className="payment-info-card supply">
                    <h3>Supply Record Information</h3>
                    <div className="payment-info-grid">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Supply ID:</span>
                        <p className="text-gray-800">{paymentData.supply_record?.supply_id || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Supply Date:</span>
                        <p className="text-gray-800">
                          {paymentData.supply_record?.supply_date 
                            ? new Date(paymentData.supply_record.supply_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                        <p className="text-lg font-semibold text-green-600">
                          Rs. {paymentData.supply_record?.total_payment?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(paymentData.supply_record?.payment_method)}`}>
                          {paymentData.supply_record?.payment_method || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Supplier Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <FaUser className="text-blue-500 mr-2" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Name:</span>
                          <p className="text-gray-800">{paymentData.supplier?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaPhone className="text-blue-500 mr-2" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Phone:</span>
                          <p className="text-gray-800">{paymentData.supplier?.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaEnvelope className="text-blue-500 mr-2" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Email:</span>
                          <p className="text-gray-800">{paymentData.supplier?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-blue-500 mr-2" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Address:</span>
                          <p className="text-gray-800">{paymentData.supplier?.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Information */}
                  {paymentData.supplier?.bank_name && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Bank Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <FaUniversity className="text-green-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">Bank Name:</span>
                            <p className="text-gray-800">{paymentData.supplier.bank_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FaCreditCard className="text-green-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">Account Number:</span>
                            <p className="text-gray-800 font-mono">
                              {paymentData.supplier.account_number || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FaIdCard className="text-green-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">Account Holder:</span>
                            <p className="text-gray-800">{paymentData.supplier.account_holder_name || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FaCodeBranch className="text-green-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">Branch:</span>
                            <p className="text-gray-800">{paymentData.supplier.bank_branch || 'N/A'}</p>
                          </div>
                        </div>
                        {paymentData.supplier.bank_code && (
                          <div className="flex items-center">
                            <FaCode className="text-green-500 mr-2" />
                            <div>
                              <span className="text-sm font-medium text-gray-600">Bank Code:</span>
                              <p className="text-gray-800 font-mono">{paymentData.supplier.bank_code}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    {paymentData.supply_record?.payment_method?.toLowerCase() === 'monthly' ? (
                      <button
                        onClick={handlePaymentGateway}
                        disabled={processing}
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {processing ? 'Processing...' : 'Pay via Gateway'}
                      </button>
                    ) : (
                      <button
                        onClick={handleMarkAsPaid}
                        disabled={processing}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {processing ? 'Processing...' : 'Mark as Paid'}
                      </button>
                    )}
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Failed to load payment information.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;