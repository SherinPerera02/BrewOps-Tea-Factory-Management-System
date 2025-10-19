import React from 'react';
import { 
  FaUserShield, 
  FaUsers, 
  FaShieldAlt, 
  FaDatabase, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import './sidebar.css';

const Sidebar = ({ dashboardData, onMenuClick }) => {
  const [activeMenu, setActiveMenu] = React.useState('dashboard');
  
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

  const handleMenuClick = (menuKey) => {
    setActiveMenu(menuKey);
    if (onMenuClick) {
      onMenuClick(menuKey);
    }
  };
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* Admin Profile Section */}
        <div className="admin-profile">
          <div className="admin-avatar">
            <FaUserShield className="admin-avatar-icon" />
          </div>
          <div className="admin-info">
            <h3>{user?.name || 'Admin Portal'}</h3>
            <p>{user?.role === 'admin' ? 'System Administrator' : user?.role || 'Administrator'}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-section">
          <h4 className="nav-section-title">
            Administration
          </h4>
          
          <button 
            onClick={() => handleMenuClick('dashboard')}
            className={`nav-link ${activeMenu === 'dashboard' ? 'active' : 'inactive'}`}
          >
            <MdDashboard className="nav-link-icon" />
            <span className="nav-link-text">Dashboard</span>
          </button>
          
          <button 
            onClick={() => handleMenuClick('user-management')}
            className={`nav-link ${activeMenu === 'user-management' ? 'active' : 'inactive'}`}
          >
            <FaUsers className="nav-link-icon" />
            <span>User Management</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h4 className="quick-actions-title">
            Quick Actions
          </h4>
          
          <div className="quick-actions-list">
            
            <button className="quick-action-btn red">
              <FaShieldAlt className="quick-action-icon" />
              <span className="quick-action-text">Security Scan</span>
            </button>
            
            <button className="quick-action-btn green">
              <FaDatabase className="quick-action-icon" />
              <span className="quick-action-text">Backup System</span>
            </button>
          </div>
        </div>

        {/* System Stats Section */}
        <div className="system-stats">
          <h4 className="system-stats-title">
            System Stats
          </h4>
          
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-card-content">
                <div className="stat-info">
                  <p>Total Users</p>
                  <p>{dashboardData?.totalUsers || 0}</p>
                </div>
                <FaUsers className="stat-icon" />
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-card-content">
                <div className="stat-info">
                  <p>System Health</p>
                  <p>{dashboardData?.systemHealth || 0}%</p>
                </div>
                <FaShieldAlt className="stat-icon" />
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-card-content">
                <div className="stat-info">
                  <p>Security Alerts</p>
                  <p>{dashboardData?.securityAlerts || 0}</p>
                </div>
                <FaExclamationTriangle className="stat-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;