import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLeaf, FaDollarSign, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { MdOutlineAddBox } from 'react-icons/md';
import { AiOutlineEdit } from 'react-icons/ai';
import { BsInfoCircle } from 'react-icons/bs';
import toast, { Toaster } from 'react-hot-toast';
import Spinner from './Spinner';

const SupplyRecords = () => {
  const navigate = useNavigate();
  const [supplyRecords, setSupplyRecords] = useState([]);
  const [allSupplyRecords, setAllSupplyRecords] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    supplier_id: '',
    quantity_kg: '',
    supply_date: new Date().toISOString().split('T')[0],
    supply_time: new Date().toTimeString().slice(0, 5),
    payment_method: 'spot',
    notes: ''
  });

  // Get saved average price from server settings (fallback to localStorage or default)
  const getSavedAveragePrice = () => {
    const savedPrice = localStorage.getItem('customAveragePrice');
    return savedPrice ? parseFloat(savedPrice) : 15.50; // Default price if none saved
  };

  const [unitPrice, setUnitPrice] = useState(getSavedAveragePrice());

  // Fetch global unit price from server and use it as default for new supply records
  const fetchServerUnitPrice = async () => {
    try {
      const res = await fetch('/api/settings/unit-price');
      if (!res.ok) return;
      const j = await res.json();
      const val = j && j.data ? j.data.unit_price_per_kg : null;
      if (val !== null && val !== undefined) setUnitPrice(parseFloat(val));
    } catch (err) {
      // silent fallback to existing unitPrice
      console.warn('Failed to fetch server unit price', err);
    }
  };
  const totalPayment = formData.quantity_kg ? (parseFloat(formData.quantity_kg) * unitPrice).toFixed(2) : '0.00';

  useEffect(() => {
    fetchSupplyRecords();
    fetchSuppliers();
    fetchServerUnitPrice();
  }, []);

  const fetchSupplyRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/supply-records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      // Accept multiple response shapes:
      // - { success: true, data: [...] }
      // - direct array [...]
      // - { data: [...] }
      let records = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (data && Array.isArray(data.data)) {
        records = data.data;
      } else if (data && data.success && Array.isArray(data.data)) {
        records = data.data;
      } else {
        // Fallback: empty list
        records = [];
      }

      setSupplyRecords(records);
      setAllSupplyRecords(records);
    } catch (error) {
      console.error('Fetch supply records error:', error);
      toast.error('Failed to fetch supply records');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // The suppliers endpoint returns data directly, not wrapped in a data property
        setSuppliers(Array.isArray(result) ? result : []);
      } else {
        toast.error('Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Fetch suppliers error:', error);
      toast.error('Failed to fetch suppliers');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplier_id || !formData.quantity_kg || parseFloat(formData.quantity_kg) <= 0) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingRecord 
        ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/supply-records/${editingRecord.id}`
        : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/supply-records`;

      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          unit_price: unitPrice
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingRecord ? 'Supply record updated successfully!' : 'Supply record created successfully!');
        fetchSupplyRecords();
        handleCloseModal();
      } else {
        toast.error(data.message || 'Failed to save supply record');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save supply record');
    }
  };

  const handleEdit = (record) => {
    // Check if record is editable (within 15 minutes)
    const createdTime = new Date(record.created_at);
    const now = new Date();
    const diffMinutes = (now - createdTime) / (1000 * 60);

    if (diffMinutes > 15) {
      toast.error('Supply record can only be edited within 15 minutes of creation');
      return;
    }

    setEditingRecord(record);
    setFormData({
      supplier_id: record.supplier_id,
      quantity_kg: record.quantity_kg,
      supply_date: record.supply_date,
      supply_time: record.supply_time || new Date().toTimeString().slice(0, 5),
      payment_method: record.payment_method,
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const handlePayment = (recordId) => {
    console.log('=== PAY BUTTON CLICKED ===');
    console.log('Record ID:', recordId);
    console.log('Navigating to:', `/payment/${recordId}`);
    console.log('Current token:', localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') ? 'Token exists' : 'No token found');
    navigate(`/payment/${recordId}`);
  };

  const handleShowDetails = async (recordId) => {
    try {
      setLoadingDetails(true);
      setShowDetailsModal(true);
      
      console.log('Fetching supply record with ID:', recordId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/supply-records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Supply record data received:', data);
      
      if (data.success) {
        console.log('Setting selected record:', data.data);
        // Backend returns nested structure with supply_record and supplier
        // Flatten it for easier access in the UI
        const flattenedRecord = {
          ...data.data.supply_record,
          supplier_name: data.data.supplier?.name,
          supplier_email: data.data.supplier?.email,
          supplier_phone: data.data.supplier?.phone,
          supplier_address: data.data.supplier?.address,
        };
        setSelectedRecord(flattenedRecord);
      } else {
        console.error('Failed to fetch:', data.message);
        toast.error(data.message || 'Failed to fetch supply record details');
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Fetch supply record details error:', error);
      toast.error('Failed to fetch supply record details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRecord(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setFormData({
      supplier_id: '',
      quantity_kg: '',
      supply_date: new Date().toISOString().split('T')[0],
      supply_time: new Date().toTimeString().slice(0, 5),
      payment_method: 'spot',
      notes: ''
    });
  };

  const applyFilters = (query = searchInput, month = selectedMonth) => {
    const q = String(query || '').trim();
    const monthVal = month;

    // start from the full unfiltered list
    const base = Array.isArray(allSupplyRecords) ? allSupplyRecords : [];

    // if no filters, restore full list
    if (q === '' && (monthVal === '' || monthVal === null)) {
      setSupplyRecords(base);
      return;
    }

    const normalizedQuery = q.toLowerCase();
    const digitsQuery = q.replace(/\D/g, '');

    const filtered = base.filter((record) => {
      if (!record) return false;

      // month filter
      if (monthVal !== '' && monthVal !== null) {
        try {
          const recordDate = new Date(record.supply_date);
          if (isNaN(recordDate.getTime())) return false;
          if (recordDate.getMonth() !== parseInt(monthVal)) return false;
        } catch (e) {
          return false;
        }
      }

      if (normalizedQuery === '') return true;

      const supplyId = record.supply_id ? String(record.supply_id).toLowerCase() : '';
      const supplierName = record.supplier_name ? String(record.supplier_name).toLowerCase() : '';
      const supplierEmail = record.supplier_email ? String(record.supplier_email).toLowerCase() : '';
      const supplierAddress = record.supplier_address ? String(record.supplier_address).toLowerCase() : '';
      const supplierPhoneDigits = (record.supplier_phone || '').toString().replace(/\D/g, '');

      const matchesText = supplyId.includes(normalizedQuery) || supplierName.includes(normalizedQuery) || supplierEmail.includes(normalizedQuery) || supplierAddress.includes(normalizedQuery);
      const matchesPhone = digitsQuery !== '' && supplierPhoneDigits.includes(digitsQuery);

      return matchesText || matchesPhone;
    });

    setSupplyRecords(filtered);
  };

  const handleSearch = () => {
    applyFilters(searchInput, selectedMonth);
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setSelectedMonth(val);
    // Apply filters from the master list so month always works regardless of prior searches
    applyFilters(searchInput, val);
  };

  // Helper to check if a record is editable (within 15 minutes of creation)
  const isEditable = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now - created) / (1000 * 60);
    return diffMinutes <= 15;
  };

  // Calculate totals
  const totalSupplies = supplyRecords.length;
  const totalQuantity = supplyRecords.reduce((sum, record) => sum + parseFloat(record.quantity_kg), 0);
  const totalValue = supplyRecords.reduce((sum, record) => sum + parseFloat(record.total_payment), 0);
  const unpaidRecords = supplyRecords.filter(record => record.payment_status === 'unpaid').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaLeaf style={{ color: '#10b981' }} />
          Supply Records Management
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            gap: '8px'
          }}
        >
          <MdOutlineAddBox style={{ fontSize: '18px' }} />
          Add Supply Record
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <FaLeaf style={{ color: '#10b981', fontSize: '24px' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Total Supplies</h3>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {totalSupplies}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Supply records</p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <FaLeaf style={{ color: '#3b82f6', fontSize: '24px' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Total Quantity</h3>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {totalQuantity.toFixed(2)} kg
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Raw tea leaves supplied</p>
        </div>



        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <FaDollarSign style={{ color: '#f59e0b', fontSize: '24px' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Total Value</h3>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            {totalValue.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Total payment amount</p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <FaDollarSign style={{ color: '#ef4444', fontSize: '24px' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Unpaid Records</h3>
          </div>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            {unpaidRecords}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Pending payments</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '16px', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
        marginBottom: '20px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', 
        gap: '12px', 
        alignItems: 'end' 
      }}>
        <div>
          <input
            type="text"
            placeholder="Search by Supply ID or Supplier..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>Select Month:</label>
          <select 
            value={selectedMonth} 
            onChange={handleMonthChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Search
        </button>
      </div>

      {/* Supply Records Table */}
      {loading ? (
        <Spinner />
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1f2937' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supply ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity (kg)</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Price</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Payment</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supply Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplyRecords.slice(0, visibleCount).map((record, index) => (
                <tr key={record.id || record.supply_id || index} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{supplyRecords.findIndex(r => (r.id ?? r.supply_id) === (record.id ?? record.supply_id)) + 1}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>{record.supply_id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{record.supplier_name || 'Unknown'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>{record.quantity_kg} kg</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{record.unit_price}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>{record.total_payment}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: record.payment_method === 'spot' ? '#10b98120' : '#f59e0b20',
                      color: record.payment_method === 'spot' ? '#10b981' : '#f59e0b'
                    }}>
                      {record.payment_method || 'spot'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: record.payment_status === 'paid' ? '#10b98120' : '#ef444420',
                      color: record.payment_status === 'paid' ? '#10b981' : '#ef4444'
                    }}>
                      {record.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{new Date(record.supply_date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleShowDetails(record.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#8b5cf6',
                          fontSize: '16px'
                        }}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {isEditable(record.created_at) ? (
                        <button
                          onClick={() => handleEdit(record)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            fontSize: '16px'
                          }}
                          title="Edit (within 15 minutes)"
                        >
                          <AiOutlineEdit />
                        </button>
                      ) : (
                        <span
                          style={{
                            color: '#9ca3af',
                            fontSize: '16px',
                            cursor: 'not-allowed'
                          }}
                          title="Edit window expired (15 minutes)"
                        >
                          <AiOutlineEdit />
                        </span>
                      )}
                      {record.payment_status !== 'paid' && (
                        <button
                          onClick={() => handlePayment(record.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                          title="Process Payment"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Show More Button */}
      {supplyRecords.length > visibleCount && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <button
            onClick={() => setVisibleCount(prev => Math.min(prev + 10, supplyRecords.length))}
            style={{
              padding: '12px 28px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Show More
          </button>
        </div>
      )}

      {/* Add/Edit Supply Record Modal */}
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
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
              {editingRecord ? 'Edit Supply Record' : 'Add Supply Record'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Supplier *
                  </label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    name="quantity_kg"
                    value={formData.quantity_kg}
                    onChange={handleInputChange}
                    placeholder="Enter quantity in kg"
                    required
                    min="0.1"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Supply Date *
                  </label>
                  <input
                    type="date"
                    name="supply_date"
                    value={formData.supply_date}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Supply Time *
                  </label>
                  <input
                    type="time"
                    name="supply_time"
                    value={formData.supply_time}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Unit Price (from average)
                  </label>
                  <input
                    type="text"
                    value={unitPrice.toFixed(2)}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Total Payment
                  </label>
                  <input
                    type="text"
                    value={totalPayment}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      color: '#10b981',
                      fontWeight: '600'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Payment Method *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="spot">Spot Payment</option>
                  <option value="monthly">Monthly Payment (Online payment)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '12px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingRecord ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supply Record Details Modal */}
      {showDetailsModal && (
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
            width: '700px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              borderBottom: '2px solid #10b981',
              paddingBottom: '16px'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaEye style={{ color: '#8b5cf6' }} />
                Supply Record Details
              </h2>
              <button
                onClick={handleCloseDetailsModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner />
              </div>

            ) : selectedRecord ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Supply ID & Status Section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #10b981'
                }}>
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Supply ID
                    </p>
                    <p style={{
                      fontSize: '18px',
                      color: '#1f2937',
                      fontWeight: '700',
                      margin: 0
                    }}>
                      {selectedRecord.supply_id}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Payment Status
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '700',
                      backgroundColor: selectedRecord.payment_status === 'paid' ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}>
                      {selectedRecord.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                </div>

                {/* Supplier Information */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaLeaf style={{ color: '#10b981' }} />
                    Supplier Information
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Supplier Name
                      </p>
                      <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '600', margin: 0 }}>
                        {selectedRecord.supplier_name || 'N/A'}
                      </p>
                    </div>
                    {selectedRecord.supplier_id && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                          Supplier ID
                        </p>
                        <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                          {selectedRecord.supplier_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supply Details */}
                <div style={{ 
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: '#1f2937',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaCalendarAlt style={{ color: '#10b981' }} />
                    Supply Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Quantity
                      </p>
                      <p style={{ fontSize: '20px', color: '#10b981', fontWeight: '700', margin: 0 }}>
                        {selectedRecord.quantity_kg} kg
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Unit Price
                      </p>
                      <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '600', margin: 0 }}>
                        Rs. {selectedRecord.unit_price}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Supply Date
                      </p>
                      <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                        {new Date(selectedRecord.supply_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Supply Time
                      </p>
                      <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                        {selectedRecord.supply_time || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div style={{ 
                  padding: '20px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #10b981'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: '#1f2937',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaDollarSign style={{ color: '#10b981' }} />
                    Payment Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Total Payment
                      </p>
                      <p style={{ fontSize: '24px', color: '#10b981', fontWeight: '700', margin: 0 }}>
                        Rs. {selectedRecord.total_payment}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                        Payment Method
                      </p>
                      <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          backgroundColor: selectedRecord.payment_method === 'spot' ? '#10b98120' : '#f59e0b20',
                          color: selectedRecord.payment_method === 'spot' ? '#10b981' : '#f59e0b'
                        }}>
                          {selectedRecord.payment_method === 'monthly' ? 'Monthly Payment (Online payment)' : 'Spot Payment'}
                        </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedRecord.notes && (
                  <div style={{ 
                    padding: '20px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b'
                  }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#1f2937',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <BsInfoCircle style={{ color: '#f59e0b' }} />
                      Notes
                    </h3>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0, lineHeight: '1.6' }}>
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div style={{ 
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}>
                  <div>
                    <strong>Created:</strong> {new Date(selectedRecord.created_at).toLocaleString()}
                  </div>
                  {selectedRecord.updated_at && (
                    <div>
                      <strong>Updated:</strong> {new Date(selectedRecord.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    onClick={handleCloseDetailsModal}
                    style={{
                      padding: '12px 28px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No record data available
              </div>
            )}
          </div>
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default SupplyRecords;