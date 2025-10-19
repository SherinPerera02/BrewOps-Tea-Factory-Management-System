import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/navigationBar';
import Footer from '../components/footer';
import Sidebar from '../components/sidebar';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeContent, setActiveContent] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    status: 'active'
  });
  
  // Calculate comprehensive dashboard statistics
  const calculateDashboardStats = () => {
    const totalUsers = users.length;
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    const statusStats = users.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = users.filter(user => {
      if (user.created_at) {
        const userDate = new Date(user.created_at);
        return userDate >= thirtyDaysAgo;
      }
      return false;
    }).length;
    
    return {
      totalUsers,
      adminCount: roleStats.admin || 0,
      managerCount: roleStats.manager || 0,
      staffCount: roleStats.staff || 0,
      supplierCount: roleStats.supplier || 0,
      activeUsers: statusStats.active || 0,
      inactiveUsers: statusStats.inactive || 0,
      pendingUsers: statusStats.pending || 0,
      recentRegistrations,
      systemHealth: 98,
      securityAlerts: 3
    };
  };
  
  const dashboardData = calculateDashboardStats();

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users when component mounts or when user-management is selected
  useEffect(() => {
    if (activeContent === 'user-management') {
      fetchUsers();
    }
  }, [activeContent]);

  // Load users data when dashboard component mounts for statistics
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
      status: 'active'
    });
  };

  // Open modal for creating new user
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    resetForm();
    setShowModal(true);
  };


  // Open modal for editing user
  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      status: user.status
    });
    setShowModal(true);
  };

  // Create or update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = modalMode === 'create' 
        ? 'http://localhost:5000/api/admin/users'
        : `http://localhost:5000/api/admin/users/${selectedUser.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`User ${modalMode === 'create' ? 'created' : 'updated'} successfully`, {
          duration: 3000,
          icon: '✅'
        });
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Operation failed', {
          duration: 4000,
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error occurred', {
        duration: 4000,
        icon: '❌'
      });
    }
  };

  // Delete user
  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          }
        });

        if (response.ok) {
          toast.success('User deleted successfully', {
            duration: 3000,
            icon: '🗑️'
          });
          fetchUsers();
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'Delete failed', {
            duration: 4000,
            icon: '❌'
          });
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Network error occurred', {
          duration: 4000,
          icon: '❌'
        });
      }
    }
  };

  const handleMenuClick = (menuKey) => {
    setActiveContent(menuKey);
  };

  const renderContent = () => {
    switch(activeContent) {
      case 'dashboard':
        return (
          <div className="dashboard-overview">
            <h1 className="dashboard-title">Dashboard Overview</h1>
            
            {/* Main Statistics Grid */}
            <div className="main-stats-grid">
              <div className="stat-card">
                <h3 className="stat-card-title">Total Users</h3>
                <p className="stat-card-value blue">{dashboardData.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-card-title">Active Users</h3>
                <p className="stat-card-value green">{dashboardData.activeUsers}</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-card-title">Recent Registrations</h3>
                <p className="stat-card-value purple">{dashboardData.recentRegistrations}</p>
                <p className="stat-card-subtitle">Last 30 days</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-card-title">System Health</h3>
                <p className="stat-card-value green">{dashboardData.systemHealth}%</p>
              </div>
            </div>

            {/* Role-based Statistics */}
            <div className="dashboard-section">
              <h2 className="section-title">Users by Role</h2>
              <div className="role-stats-grid">
                <div className="role-card admin">
                  <h3 className="role-card-title">Administrators</h3>
                  <p className="role-card-value">{dashboardData.adminCount}</p>
                </div>
                <div className="role-card manager">
                  <h3 className="role-card-title">Managers</h3>
                  <p className="role-card-value">{dashboardData.managerCount}</p>
                </div>
                <div className="role-card staff">
                  <h3 className="role-card-title">Staff Members</h3>
                  <p className="role-card-value">{dashboardData.staffCount}</p>
                </div>
                <div className="role-card supplier">
                  <h3 className="role-card-title">Suppliers</h3>
                  <p className="role-card-value">{dashboardData.supplierCount}</p>
                </div>
              </div>
            </div>

            {/* User Status Overview */}
            <div className="dashboard-section">
              <h2 className="section-title">User Status Overview</h2>
              <div className="status-overview-grid">
                <div className="status-card active">
                  <h3 className="status-card-title">Active Users</h3>
                  <p className="status-card-value active">{dashboardData.activeUsers}</p>
                </div>
                <div className="status-card inactive">
                  <h3 className="status-card-title">Inactive Users</h3>
                  <p className="status-card-value inactive">{dashboardData.inactiveUsers}</p>
                </div>
                <div className="status-card pending">
                  <h3 className="status-card-title">Pending Users</h3>
                  <p className="status-card-value pending">{dashboardData.pendingUsers}</p>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="system-alerts-grid">
              <div className="alert-card">
                <h3 className="alert-card-title">Security Alerts</h3>
                <p className="alert-card-value">{dashboardData.securityAlerts}</p>
                <p className="alert-card-subtitle">Requires attention</p>
              </div>
              <div className="alert-card">
                <h3 className="alert-card-title">User Growth</h3>
                <p className="growth-text">
                  {dashboardData.recentRegistrations > 0 
                    ? `+${dashboardData.recentRegistrations} new users this month`
                    : 'No new registrations this month'
                  }
                </p>
              </div>
            </div>
          </div>
        );
      case 'user-management':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>User Management</h1>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Loading users...</p>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Created</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', color: '#374151' }}>{user.name}</td>
                          <td style={{ padding: '12px', color: '#374151' }}>{user.email}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: user.role === 'admin' ? '#fef3c7' : user.role === 'manager' ? '#dbeafe' : user.role === 'supplier' ? '#d1fae5' : '#f3f4f6',
                              color: user.role === 'admin' ? '#92400e' : user.role === 'manager' ? '#1e40af' : user.role === 'supplier' ? '#065f46' : '#374151'
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#374151' }}>{user.phone || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: user.status === 'active' ? '#d1fae5' : user.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color: user.status === 'active' ? '#065f46' : user.status === 'pending' ? '#92400e' : '#991b1b'
                            }}>
                              {user.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#374151' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => openEditModal(user)}
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                marginRight: '8px',
                                fontSize: '12px'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal for Create/Edit User */}
            {showModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '24px',
                  width: '500px',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
                    {modalMode === 'create' ? 'Create New User' : 'Edit User'}
                  </h2>
                  
                  <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                        Password {modalMode === 'edit' && '(leave blank to keep current)'}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={modalMode === 'create'}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                        Role
                      </label>
                      {modalMode === 'edit' ? (
                        <div style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#f9fafb' }}>{formData.role}</div>
                      ) : (
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="staff">Staff</option>
                          <option value="supplier">Supplier</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {modalMode === 'create' ? 'Create User' : 'Update User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case 'role-permissions':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Role & Permissions</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600">Configure user roles and their associated permissions.</p>
              <div className="mt-4">
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2">
                  Create Role
                </button>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                  Manage Permissions
                </button>
              </div>
            </div>
          </div>
        );
      case 'system-security':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">System Security</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600">Monitor and configure system security settings.</p>
              <div className="mt-4">
                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-2">
                  Security Scan
                </button>
                <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                  View Threats
                </button>
              </div>
            </div>
          </div>
        );
      case 'system-logs':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">System Logs</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600">View and analyze system logs and activities.</p>
              <div className="mt-4">
                <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 mr-2">
                  View Logs
                </button>
                <button className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600">
                  Export Logs
                </button>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600">Generate reports and view system analytics.</p>
              <div className="mt-4">
                <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 mr-2">
                  Generate Report
                </button>
                <button className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800">Welcome to Admin Dashboard</h1>
            <p className="text-gray-600 mt-4">Select a menu item from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard-container">
      <NavigationBar />
      {/* Main Layout Area */}
      <main className="admin-main-layout">
        {/* Sidebar Container */}
        <aside className="admin-sidebar-container">
          <Sidebar dashboardData={dashboardData} onMenuClick={handleMenuClick} />
        </aside>
        
        {/* Content Area */}
        <section className="admin-content-area">
          <div className="admin-content-wrapper">
            {renderContent()}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;