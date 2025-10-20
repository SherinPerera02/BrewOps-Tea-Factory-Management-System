import React from 'react';
import { 
  FaIndustry, 
  FaChartBar, 
  FaEnvelope,
  FaCogs
} from 'react-icons/fa';
import { MdDashboard, MdFactory } from 'react-icons/md';
import './sidebar.css';

const ProductionSidebar = ({ dashboardData, activeContent, setActiveContent }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsOpen(o => !o);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

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

  const handleClick = (cb) => {
    try { setIsOpen(false); } catch (e) {}
    if (cb && typeof cb === 'function') cb();
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-content">
        {/* Production Manager Profile Section */}
        <div className="admin-profile">
          <div className="admin-avatar">
            <FaIndustry className="admin-avatar-icon" />
          </div>
          <div className="admin-info">
            <h3>{user?.name || 'Production Portal'}</h3>
            <p>{user?.role === 'manager' || user?.role === 'production_manager' ? 'Production Manager' : user?.role || 'Manager'}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-section">
          <h4 className="nav-section-title">
            Production Management
          </h4>
          
          <div 
            onClick={() => handleClick(() => setActiveContent && setActiveContent('dashboard'))}
            className={`nav-link ${activeContent === 'dashboard' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <MdDashboard className="nav-link-icon" />
            <span className="nav-link-text">Dashboard</span>
          </div>
          
          <div 
            onClick={() => handleClick(() => setActiveContent && setActiveContent('inventory-management'))}
            className={`nav-link ${activeContent === 'inventory-management' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <MdFactory className="nav-link-icon" />
            <span>Inventory Management</span>
          </div>

                    <div 
            onClick={() => handleClick(() => setActiveContent && setActiveContent('production'))}
            className={`nav-link ${activeContent === 'production' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <FaCogs className="nav-link-icon" />
            <span>Production</span>
          </div>
          

          
          <div 
            onClick={() => handleClick(() => setActiveContent && setActiveContent('analytics'))}
            className={`nav-link ${activeContent === 'analytics' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <FaChartBar className="nav-link-icon" />
            <span>Analytics</span>
          </div>
          
          <div 
            onClick={() => handleClick(() => setActiveContent && setActiveContent('messages'))}
            className={`nav-link ${activeContent === 'messages' ? 'active' : 'inactive'}`}
            style={{ cursor: 'pointer' }}
          >
            <FaEnvelope className="nav-link-icon" />
            <span>Messages</span>
          </div>
        </div>

        
          </div>
        </div>

  );
};

export default ProductionSidebar;