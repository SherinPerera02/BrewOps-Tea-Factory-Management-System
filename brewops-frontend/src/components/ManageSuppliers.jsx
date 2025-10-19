import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaUsers, FaTimes, FaBan, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineEdit } from 'react-icons/ai';
import toast from 'react-hot-toast';
import '../styles/ManageSuppliers.css';

const ManageSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    supplier_id: '',
    address: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    bank_branch: '',
    bank_code: ''
  });
  // Static bank list (name + code). Can be moved to a JSON file or loaded remotely later.
  const banksList = [
    { name: 'Bank of Ceylon', code: 'BOC' },
    { name: 'Commercial Bank', code: 'COMMB' },
    { name: 'People\'s Bank', code: 'PEOP' },
    { name: 'Sampath Bank', code: 'SAMP' },
    { name: 'Hatton National Bank', code: 'HNB' },
    { name: 'National Savings Bank', code: 'NSB' },
    { name: 'DFCC Bank', code: 'DFCC' },
    { name: 'Seylan Bank', code: 'SEY' },
    { name: 'Pan Asia Bank', code: 'PAN' },
    { name: 'NTB Bank', code: 'NTB' }
  ];
  const [bankQuery, setBankQuery] = useState('');
  const [filteredBanks, setFilteredBanks] = useState(banksList);
  const [showBankList, setShowBankList] = useState(false);
  const bankInputRef = useRef(null);
  const [showSupplierPassword, setShowSupplierPassword] = useState(false);

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // backend may return either a direct array or an object like { success, data: [...] }
        const suppliersArray = Array.isArray(data)
          ? data
          : (data.data || data.suppliers || []);
        setSuppliers(suppliersArray);
      } else {
        console.error('Failed to fetch suppliers');
        toast.error('Failed to fetch suppliers', {
          duration: 4000,
          
        });
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Error fetching suppliers', {
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Check if supplier is editable (only active suppliers can be edited)
  const isSupplierEditable = (supplier) => {
    return supplier.status === 'active';
  };

  // Generate next supplier ID
  const generateSupplierId = () => {
    // Find the highest existing ID number
    let maxId = 0;
    suppliers.forEach(supplier => {
      if (supplier.supplier_id && supplier.supplier_id.startsWith('SUP')) {
        const idNumber = parseInt(supplier.supplier_id.substring(3));
        if (!isNaN(idNumber) && idNumber > maxId) {
          maxId = idNumber;
        }
      }
    });
    // Generate next ID (start from 1 if no existing suppliers)
    const nextId = maxId + 1;
    return `SUP${nextId.toString().padStart(4, '0')}`;
  };

  // Generate a secure random password for new suppliers
  const generatePassword = (length = 12) => {
    // Alphanumeric only (no special characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

  // Handle add new supplier
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newSupplier.name || !newSupplier.email || !newSupplier.password) {
      toast.error('Name, email, and password are required', { duration: 4000 });
      return;
    }

    // Name validation
    if (newSupplier.name.trim().length < 2 || newSupplier.name.trim().length > 100) {
      toast.error('Name must be between 2 and 100 characters', { duration: 4000 });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSupplier.email)) {
      toast.error('Please enter a valid email address', { duration: 4000 });
      return;
    }

    // Password validation
    if (newSupplier.password.length < 6 || newSupplier.password.length > 128) {
      toast.error('Password must be between 6 and 128 characters', { duration: 4000 });
      return;
    }

    // Phone validation (optional)
    let normalizedPhoneForSubmit = '';
    if (newSupplier.phone && newSupplier.phone.trim() !== '') {
      // normalize to digits and ensure exactly 10 digits
      const normalized = newSupplier.phone.replace(/\D/g, '');
      if (!/^\d{10}$/.test(normalized)) {
        toast.error('Phone number must contain exactly 10 digits', { duration: 4000 });
        return;
      }
      normalizedPhoneForSubmit = normalized;
    }

    // Account number/holder consistency
    if (newSupplier.account_number && (!newSupplier.account_holder_name || newSupplier.account_holder_name.trim() === '')) {
      toast.error('Account holder name is required when account number is provided', { duration: 4000 });
      return;
    }

    if (newSupplier.account_number && (newSupplier.account_number.length < 4 || newSupplier.account_number.length > 34)) {
      toast.error('Account number length is invalid', { duration: 4000 });
      return;
    }

    // Simple client-side duplicate phone check against loaded suppliers
    if (newSupplier.phone && newSupplier.phone.trim() !== "") {
      const normalizedNewPhone = newSupplier.phone.replace(/\D/g, '');
      const duplicate = suppliers.find(s => (s.phone || '').replace(/\D/g, '') === normalizedNewPhone);
      if (duplicate) {
        toast.error('Phone number already exists for another supplier', { duration: 4000 });
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: newSupplier.name,
        email: newSupplier.email,
        password: newSupplier.password,
        phone: normalizedPhoneForSubmit || null,
        address: newSupplier.address || null,
        bank_name: newSupplier.bank_name || null,
        account_number: newSupplier.account_number || null,
        account_holder_name: newSupplier.account_holder_name || null,
        bank_branch: newSupplier.bank_branch || null,
        bank_code: newSupplier.bank_code || null,
        role: 'supplier'
      };

      console.debug('Adding supplier payload:', payload);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/suppliers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (err) { /* non-json response */ }

      if (response.ok) {
        const addedSupplier = json || { id: null };
        // If backend wrapped in { success, data } unwrap
        const supplierObj = (addedSupplier && addedSupplier.data) ? addedSupplier.data : addedSupplier;
        setSuppliers(prev => [...prev, supplierObj]);
        setShowAddModal(false);
        setNewSupplier({
          name: '',
          email: '',
          password: '',
          phone: '',
          supplier_id: '' ,
          address: '',
          bank_name: '',
          account_number: '',
          account_holder_name: '',
          bank_branch: '',
          bank_code: ''
        });
  const displayName = supplierObj && supplierObj.name ? supplierObj.name : 'Supplier';
  const displayId = supplierObj && supplierObj.supplier_id ? ` (${supplierObj.supplier_id})` : '';
  // Log to console for debugging and visibility
  console.info('Supplier add success branch reached. supplierObj:', supplierObj);
  toast.success(`${displayName} added successfully${displayId}!`);
      } else {
        const errorMessage = (json && (json.message || json.error)) || text || 'Failed to add supplier';
        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Error adding supplier', { duration: 4000 });
    }
  };

  // Handle edit supplier
  const handleEditSupplier = async (e) => {
    e.preventDefault();
    
    if (!newSupplier.name || !newSupplier.email) {
      toast.error('Name and email are required', {
        duration: 4000
      });
      return;
    }

    // Name validation
    if (newSupplier.name.trim().length < 2 || newSupplier.name.trim().length > 100) {
      toast.error('Name must be between 2 and 100 characters', { duration: 4000 });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSupplier.email)) {
      toast.error('Please enter a valid email address', { duration: 4000 });
      return;
    }

    // Password validation (if provided)
    if (newSupplier.password && (newSupplier.password.length < 6 || newSupplier.password.length > 128)) {
      toast.error('Password must be between 6 and 128 characters', { duration: 4000 });
      return;
    }

    // Phone validation (optional)
    if (newSupplier.phone && newSupplier.phone.trim() !== '') {
      const normalized = newSupplier.phone.replace(/\D/g, '');
      if (!/^\d{10}$/.test(normalized)) {
        toast.error('Phone number must contain exactly 10 digits', { duration: 4000 });
        return;
      }
      newSupplier.phone = normalized;
    }

    // Account number/holder consistency
    if (newSupplier.account_number && (!newSupplier.account_holder_name || newSupplier.account_holder_name.trim() === '')) {
      toast.error('Account holder name is required when account number is provided', { duration: 4000 });
      return;
    }

    if (newSupplier.account_number && (newSupplier.account_number.length < 4 || newSupplier.account_number.length > 34)) {
      toast.error('Account number length is invalid', { duration: 4000 });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSupplier.name,
          email: newSupplier.email,
          phone: newSupplier.phone,
          address: newSupplier.address,
          bank_name: newSupplier.bank_name,
          account_number: newSupplier.account_number,
          account_holder_name: newSupplier.account_holder_name,
          bank_branch: newSupplier.bank_branch,
          bank_code: newSupplier.bank_code,
          ...(newSupplier.password && { password: newSupplier.password })
          // supplier_id cannot be edited
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the supplier in the list
          setSuppliers(suppliers.map(supplier => 
            supplier.id === editingSupplier.id ? data.data : supplier
          ));
          toast.success('Supplier updated successfully!');
          closeModal();
        } else {
          toast.error(data.message || 'Failed to update supplier');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update supplier', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Error updating supplier', { duration: 4000 });
    }
  };

  // Open edit modal
  // Open add modal with auto-generated supplier ID
  const openAddModal = () => {
    setEditingSupplier(null);
    // Auto-generate a password and pre-fill it so the user can copy/see it
    const generated = generatePassword(12);
    setNewSupplier({
      name: '',
      email: '',
      password: generated,
      phone: '',
      supplier_id: 'Auto-generated (SUP000001 format)',
      address: '',
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      bank_branch: '',
      bank_code: ''
    });
    // Show the password by default when adding so user can copy it
    setShowSupplierPassword(true);
    setShowAddModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name || '',
      email: supplier.email || '',
      password: '', // Don't pre-fill password for security
      phone: supplier.phone || '',
      supplier_id: supplier.supplier_id || '',
      address: supplier.address || '',
      bank_name: supplier.bank_name || '',
      account_number: supplier.account_number || '',
      account_holder_name: supplier.account_holder_name || '',
      bank_branch: supplier.bank_branch || '',
      bank_code: supplier.bank_code || ''
    });
    setShowAddModal(true);
  };

  // Filter suppliers based on search term (includes phone/address)
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedSearchDigits = searchTerm.replace(/\D/g, '');

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!supplier) return false;
    const name = supplier.name ? String(supplier.name).toLowerCase() : '';
    const email = supplier.email ? String(supplier.email).toLowerCase() : '';
    const supplierId = supplier.supplier_id ? String(supplier.supplier_id).toLowerCase() : '';
    const address = supplier.address ? String(supplier.address).toLowerCase() : '';

    const phoneDigits = (supplier.phone || '').toString().replace(/\D/g, '');

    const nameMatch = name.includes(normalizedSearch);
    const emailMatch = email.includes(normalizedSearch);
    const idMatch = supplierId.includes(normalizedSearch);
    const addressMatch = address.includes(normalizedSearch);
    const phoneMatch = normalizedSearchDigits !== '' && phoneDigits.includes(normalizedSearchDigits);

    // If searchTerm is empty, include all
    if (normalizedSearch === '') return true;

    return nameMatch || emailMatch || idMatch || addressMatch || phoneMatch;
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Bank dropdown helpers
  const handleBankQueryChange = (e) => {
    const q = e.target.value;
    setBankQuery(q);
    if (!q) {
      setFilteredBanks(banksList);
    } else {
      const lower = q.toLowerCase();
      setFilteredBanks(banksList.filter(b => b.name.toLowerCase().includes(lower) || (b.code || '').toLowerCase().includes(lower)));
    }
    setShowBankList(true);
    // Update newSupplier.bank_name as the user types; clear bank_code until explicit selection
    setNewSupplier(prev => ({ ...prev, bank_name: q, bank_code: '' }));
  };

  const selectBank = (bank) => {
    setNewSupplier(prev => ({
      ...prev,
      bank_name: bank.name,
      bank_code: bank.code
    }));
    setBankQuery(bank.name);
    setShowBankList(false);
    // focus next input (account holder)
    if (bankInputRef.current) {
      bankInputRef.current.focus();
    }
  };

  // Close bank list when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest || !e.target.closest('.bank-dropdown-wrapper')) return;
      // if clicked inside, do nothing
    };
    const handleDocumentClick = (e) => {
      // if click outside bank dropdown, close
      const wrapper = document.querySelector('.bank-dropdown-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        setShowBankList(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // View supplier details
  const handleViewSupplier = async (supplierId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/staff/suppliers/${supplierId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setViewingSupplier(data.data);
          setShowViewModal(true);
        } else {
          toast.error(data.message || 'Failed to fetch supplier details');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch supplier details');
      }
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      toast.error('Error fetching supplier details');
    }
  };

  // Close modal
  const closeModal = () => {
    setShowAddModal(false);
    setEditingSupplier(null);
    setShowViewModal(false);
    setViewingSupplier(null);
    setNewSupplier({
      name: '',
      email: '',
      password: '',
      phone: '',
      supplier_id: '',
      address: '',
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      bank_branch: '',
      bank_code: ''
    });
  };

  if (loading) {
    return (
      <div className="manage-suppliers-container">
        <div className="suppliers-loading-container">
          <div className="suppliers-loading-spinner"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-suppliers-container">
      {/* Inline Toaster so success/error toasts show even if global Toaster is not visible */}
      <Toaster position="top-center" />
      <div className="suppliers-header">
        <div className="suppliers-header-left">
          <FaUsers className="suppliers-header-icon" />
          <h2>Manage Suppliers</h2>
        </div>
        <button 
          className="add-supplier-btn"
          onClick={openAddModal}
        >
          <FaPlus /> Add New Supplier
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="suppliers-controls">
        <div className="suppliers-search-container">
          <FaSearch className="suppliers-search-icon" />
          <input
            type="text"
            placeholder="Search suppliers by name, email, or supplier ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="suppliers-search-input"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="suppliers-table-container">
        {filteredSuppliers.length === 0 ? (
          <div className="no-suppliers">
            <FaUsers size={48} />
            <h3>No suppliers found</h3>
            <p>Add your first supplier to get started.</p>
          </div>
        ) : (
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Supplier ID</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier, idx) => (
                <tr key={supplier.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{supplier.name}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone || 'N/A'}</td>
                  <td>{supplier.supplier_id || 'Not Assigned'}</td>
                  <td>
                    <span className={`suppliers-status-badge ${supplier.status}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td>{new Date(supplier.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="suppliers-action-buttons">
                      <button
                        onClick={() => handleViewSupplier(supplier.id)}
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
                      <button
                        onClick={() => openEditModal(supplier)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#3b82f6',
                          fontSize: '16px'
                        }}
                        title="Edit Supplier"
                      >
                        <AiOutlineEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Supplier Modal */}
      {showAddModal && (
        <div className="suppliers-modal-overlay">
          <div className="suppliers-modal-content">
            <div className="suppliers-modal-header">
              <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button className="suppliers-close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={editingSupplier ? handleEditSupplier : handleAddSupplier} className="suppliers-modal-form">
              <div className="suppliers-form-row">
                <div className="suppliers-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newSupplier.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="suppliers-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="suppliers-form-row">
                <div className="suppliers-form-group">
                  <label>Password {!editingSupplier ? '*' : '(leave blank to keep current)'}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSupplierPassword ? 'text' : 'password'}
                      name="password"
                      value={newSupplier.password}
                      onChange={handleInputChange}
                      required={!editingSupplier}
                      placeholder={editingSupplier ? "Enter new password (optional)" : "Enter password"}
                      style={{ paddingRight: '40px' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: '#374151',
                        fontSize: '20px'
                      }}
                      onClick={() => setShowSupplierPassword((prev) => !prev)}
                    >
                      {showSupplierPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>
                <div className="suppliers-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label style={{ visibility: 'hidden' }}>Regenerate</label>
                  <button
                    type="button"
                    className="suppliers-regen-btn"
                    onClick={() => {
                      const gen = generatePassword(12);
                      setNewSupplier(prev => ({ ...prev, password: gen }));
                      setShowSupplierPassword(true);
                      // focus password input after regen
                      setTimeout(() => {
                        const pwdInput = document.querySelector('input[name="password"]');
                        if (pwdInput) pwdInput.focus();
                      }, 50);
                    }}
                    style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                  >
                    Regenerate
                  </button>
                </div>
                <div className="suppliers-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newSupplier.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="suppliers-form-row">
                <div className="suppliers-form-group">
                  <label>
                    Supplier ID 
                    <span style={{ color: '#6b7280', fontWeight: 'normal' }}> (Auto-generated SUP000001 format)</span>
                  </label>
                  <input
                    type="text"
                    name="supplier_id"
                    value={newSupplier.supplier_id}
                    placeholder="Auto-generated (SUP000001)"
                    readOnly={true}
                    className="suppliers-disabled-input"
                  />
                </div>
                <div className="suppliers-form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={newSupplier.address}
                    onChange={handleInputChange}
                    placeholder="Enter supplier address"
                  />
                </div>
              </div>

              {/* Bank Information Section */}
              <div className="suppliers-form-section">
                <h4 style={{ margin: '20px 0 10px 0', color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                  Bank Information
                </h4>
                
                <div className="suppliers-form-row">
                  <div className="suppliers-form-group bank-dropdown-wrapper" style={{ position: 'relative' }}>
                    <label>Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={bankQuery || newSupplier.bank_name}
                      onChange={handleBankQueryChange}
                      onFocus={() => setShowBankList(true)}
                      placeholder="Search bank by name or code (e.g., Bank of Ceylon)"
                      aria-autocomplete="list"
                      ref={bankInputRef}
                    />
                    {showBankList && (
                      <div className="bank-list" style={{ position: 'absolute', zIndex: 40, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', width: '100%', maxHeight: '220px', overflowY: 'auto', borderRadius: 6 }}>
                        {filteredBanks.length === 0 ? (
                          <div style={{ padding: 10, color: '#6b7280' }}>No banks found</div>
                        ) : (
                          filteredBanks.map((b, i) => (
                            <div
                              key={b.code + i}
                              onClick={() => selectBank(b)}
                              style={{ padding: '8px 12px', cursor: 'pointer' }}
                              onKeyDown={(e) => { if (e.key === 'Enter') selectBank(b); }}
                              role="button"
                              tabIndex={0}
                            >
                              <strong style={{ display: 'block' }}>{b.name}</strong>
                              <small style={{ color: '#6b7280' }}>{b.code}</small>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="suppliers-form-group">
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      name="account_holder_name"
                      value={newSupplier.account_holder_name}
                      onChange={handleInputChange}
                      placeholder="Enter account holder's name"
                    />
                  </div>
                </div>

                <div className="suppliers-form-row">
                  <div className="suppliers-form-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={newSupplier.account_number}
                      onChange={handleInputChange}
                      placeholder="Enter bank account number"
                    />
                  </div>
                  <div className="suppliers-form-group">
                    <label>Bank Branch</label>
                    <input
                      type="text"
                      name="bank_branch"
                      value={newSupplier.bank_branch}
                      onChange={handleInputChange}
                      placeholder="e.g., Colombo Main, Kandy Branch"
                    />
                  </div>
                </div>

                <div className="suppliers-form-row">
                  <div className="suppliers-form-group">
                    <label>Bank Code/SWIFT Code</label>
                    <input
                      type="text"
                      name="bank_code"
                      value={newSupplier.bank_code}
                      onChange={handleInputChange}
                      placeholder="e.g., BCEYLKLX, CCEYLKLX"
                    />
                  </div>
                  <div className="suppliers-form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value="supplier"
                      disabled
                      className="suppliers-disabled-input"
                    />
                  </div>
                </div>
              </div>

              <div className="suppliers-modal-actions">
                <button type="button" className="suppliers-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="suppliers-submit-btn">
                  {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Details Modal */}
      {showViewModal && viewingSupplier && (
        <div className="suppliers-modal-overlay">
          <div className="suppliers-modal-content">
            <div className="suppliers-modal-header">
              <h3>Supplier Details</h3>
              <button className="suppliers-close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="suppliers-modal-body">
              <div className="suppliers-detail-section">
                <div className="suppliers-detail-group">
                  <label><strong>Name:</strong></label>
                  <p>{viewingSupplier.name}</p>
                </div>
                <div className="suppliers-detail-group">
                  <label><strong>Email:</strong></label>
                  <p>{viewingSupplier.email}</p>
                </div>
                <div className="suppliers-detail-group">
                  <label><strong>Phone:</strong></label>
                  <p>{viewingSupplier.phone}</p>
                </div>
                <div className="suppliers-detail-group">
                  <label><strong>Supplier ID:</strong></label>
                  <p>{viewingSupplier.supplier_id || 'Not Assigned'}</p>
                </div>
                <div className="suppliers-detail-group">
                  <label><strong>Address:</strong></label>
                  <p>{viewingSupplier.address || 'Not provided'}</p>
                </div>
                <div className="suppliers-detail-group">
                  <label><strong>Role:</strong></label>
                  <p className="suppliers-role-badge">{viewingSupplier.role}</p>
                </div>
                <div className="suppliers-detail-group">
                  <label><strong>Registration Date:</strong></label>
                  <p>{new Date(viewingSupplier.created_at).toLocaleDateString()}</p>
                </div>
                
                {/* Bank Information Section */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '16px' }}>Bank Information</h4>
                  <div className="suppliers-detail-group">
                    <label><strong>Bank Name:</strong></label>
                    <p>{viewingSupplier.bank_name || 'Not provided'}</p>
                  </div>
                  <div className="suppliers-detail-group">
                    <label><strong>Account Holder:</strong></label>
                    <p>{viewingSupplier.account_holder_name || 'Not provided'}</p>
                  </div>
                  <div className="suppliers-detail-group">
                    <label><strong>Account Number:</strong></label>
                    <p>{viewingSupplier.account_number ? `***${viewingSupplier.account_number.slice(-4)}` : 'Not provided'}</p>
                  </div>
                  <div className="suppliers-detail-group">
                    <label><strong>Bank Branch:</strong></label>
                    <p>{viewingSupplier.bank_branch || 'Not provided'}</p>
                  </div>
                  <div className="suppliers-detail-group">
                    <label><strong>Bank Code:</strong></label>
                    <p>{viewingSupplier.bank_code || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSuppliers;