import React from 'react';
import { 
  FaShoppingCart, 
  FaWarehouse,
  FaEnvelope,
  FaLock
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import './sidebar.css';

const SupplierSidebar = ({ dashboardData, activeContent, setActiveContent }) => {
  // Get logged-in user info from localStorage or sessionStorage
  const getUserInfo = () => {
    try {
      const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch {
      return null;
    }
  };

  const user = getUserInfo();

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* Supplier Profile Section */}
        <div className="admin-profile">
          <div className="admin-avatar">
            <FaWarehouse className="admin-avatar-icon" />
          </div>
          <div className="admin-info">
            <h3>{user?.name || 'Supplier Portal'}</h3>
            <p>{user?.role === 'supplier' ? 'Supply Partner' : user?.role || 'Supplier'}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-section">
          <h4 className="nav-section-title">
            Supply Management
          </h4>
          
          <div 
            onClick={() => setActiveContent('dashboard')}
            className={`nav-link ${activeContent === 'dashboard' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <MdDashboard className="nav-link-icon" />
            <span className="nav-link-text">Dashboard</span>
          </div>
          
          <div 
            onClick={() => setActiveContent('messages')}
            className={`nav-link ${activeContent === 'messages' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <FaEnvelope className="nav-link-icon" />
            <span>Messages</span>
          </div>
          
          <div 
            onClick={() => setActiveContent('reports')}
            className={`nav-link ${activeContent === 'reports' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <FaShoppingCart className="nav-link-icon" />
            <span>Reports</span>
          </div>

          {/* Change Password - only show when user must change password */}
          {user && (user.must_change_password === 1 || user.must_change_password === '1' || user.must_change_password === true) && (
            <div
              onClick={() => { window.location.href = '/supplier-change-password'; }}
              className={`nav-link ${activeContent === 'change-password' ? 'active' : 'inactive'}`}
              style={{ cursor: 'pointer' }}
            >
              <FaLock className="nav-link-icon" />
              <span>Change Password</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierSidebar;