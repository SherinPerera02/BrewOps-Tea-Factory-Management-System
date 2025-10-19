import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaUsers, 
  FaChartBar,
  FaLeaf,
  FaCreditCard
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import './sidebar.css';

const StaffSidebar = ({ dashboardData, activeContent, setActiveContent }) => {
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
        {/* Staff Profile Section */}
        <div className="admin-profile">
          <div className="admin-avatar">
            <FaUser className="admin-avatar-icon" />
          </div>
          <div className="admin-info">
            <h3>{user?.name || 'Staff Portal'}</h3>
            <p>{user?.role === 'staff' ? 'Staff Member' : user?.role || 'Staff'}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-section">
          <h4 className="nav-section-title">
            Staff Management
          </h4>
          
          <Link 
            to="/staff-dashboard" 
            className={`nav-link ${activeContent === 'dashboard' ? 'active' : 'inactive'}`}
            onClick={() => setActiveContent && setActiveContent('dashboard')}
          >
            <MdDashboard className="nav-link-icon" />
            <span className="nav-link-text">Dashboard</span>
          </Link>
          
          <div 
            className={`nav-link ${activeContent === 'reports' ? 'active' : 'inactive'}`}
            onClick={() => setActiveContent && setActiveContent('reports')}
            style={{ cursor: 'pointer' }}
          >
            <FaChartBar className="nav-link-icon" />
            <span>Reports</span>
          </div>
          
          <div 
            className={`nav-link ${activeContent === 'supply-records' ? 'active' : 'inactive'}`}
            onClick={() => setActiveContent && setActiveContent('supply-records')}
            style={{ cursor: 'pointer' }}
          >
            <FaLeaf className="nav-link-icon" />
            <span>Supply Records</span>
          </div>
          
          <div 
            className={`nav-link ${activeContent === 'payments' ? 'active' : 'inactive'}`}
            onClick={() => setActiveContent && setActiveContent('payments')}
            style={{ cursor: 'pointer' }}
          >
            <FaCreditCard className="nav-link-icon" />
            <span>Payment Management</span>
          </div>
          
          <Link 
            to="/staff-dashboard" 
            className={`nav-link ${activeContent === 'suppliers' ? 'active' : 'inactive'}`}
            onClick={() => setActiveContent && setActiveContent('suppliers')}
          >
            <FaUsers className="nav-link-icon" />
            <span>Manage Suppliers</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffSidebar;