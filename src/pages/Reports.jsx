import React, { useState, useEffect } from 'react';
import { FaChartBar, FaChartLine, FaChartPie, FaDownload, FaCalendarAlt, FaUsers, FaShieldAlt } from 'react-icons/fa';

const Reports = () => {
  const [reportData, setReportData] = useState({});
  const [selectedReport, setSelectedReport] = useState('user-activity');
  const [dateRange, setDateRange] = useState('last-30-days');

  useEffect(() => {
    // Mock data - replace with actual API calls
    setReportData({
      userActivity: {
        totalLogins: 1247,
        uniqueUsers: 89,
        avgSessionTime: '24 minutes',
        peakHours: '9:00 AM - 11:00 AM'
      },
      security: {
        totalAlerts: 23,
        resolvedAlerts: 20,
        criticalAlerts: 1,
        lastScan: '2024-01-15 14:30:00'
      },
      system: {
        uptime: '99.8%',
        avgResponseTime: '120ms',
        totalRequests: 15420,
        errorRate: '0.2%'
      }
    });
  }, []);

  const reportTypes = [
    { id: 'user-activity', name: 'User Activity', icon: FaUsers },
    { id: 'security', name: 'Security Report', icon: FaShieldAlt },
    { id: 'system-performance', name: 'System Performance', icon: FaChartLine },
    { id: 'audit-trail', name: 'Audit Trail', icon: FaChartBar }
  ];

  const renderUserActivityReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Logins</p>
              <p className="text-2xl font-bold text-blue-800">{reportData.userActivity?.totalLogins}</p>
            </div>
            <FaUsers className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Unique Users</p>
              <p className="text-2xl font-bold text-green-800">{reportData.userActivity?.uniqueUsers}</p>
            </div>
            <FaChartBar className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Avg Session Time</p>
              <p className="text-2xl font-bold text-purple-800">{reportData.userActivity?.avgSessionTime}</p>
            </div>
            <FaChartLine className="text-3xl text-purple-500" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Peak Hours</p>
              <p className="text-lg font-bold text-orange-800">{reportData.userActivity?.peakHours}</p>
            </div>
            <FaCalendarAlt className="text-3xl text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Login Activity Chart</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );

  const renderSecurityReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Total Alerts</p>
              <p className="text-2xl font-bold text-red-800">{reportData.security?.totalAlerts}</p>
            </div>
            <FaShieldAlt className="text-3xl text-red-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Resolved Alerts</p>
              <p className="text-2xl font-bold text-green-800">{reportData.security?.resolvedAlerts}</p>
            </div>
            <FaChartBar className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-yellow-800">{reportData.security?.criticalAlerts}</p>
            </div>
            <FaChartPie className="text-3xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Last Scan</p>
              <p className="text-sm font-bold text-blue-800">{reportData.security?.lastScan}</p>
            </div>
            <FaCalendarAlt className="text-3xl text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Security Trends</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Security trends chart would go here</p>
        </div>
      </div>
    </div>
  );

  const renderSystemPerformanceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">System Uptime</p>
              <p className="text-2xl font-bold text-green-800">{reportData.system?.uptime}</p>
            </div>
            <FaChartLine className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-blue-800">{reportData.system?.avgResponseTime}</p>
            </div>
            <FaChartBar className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Total Requests</p>
              <p className="text-2xl font-bold text-purple-800">{reportData.system?.totalRequests}</p>
            </div>
            <FaChartPie className="text-3xl text-purple-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-800">{reportData.system?.errorRate}</p>
            </div>
            <FaChartLine className="text-3xl text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Performance metrics chart would go here</p>
        </div>
      </div>
    </div>
  );

  const renderAuditTrailReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Audit Events</h3>
        <div className="space-y-4">
          {[
            { action: 'User Created', user: 'admin@example.com', timestamp: '2024-01-15 15:30:00', details: 'Created user john.doe@example.com' },
            { action: 'Role Modified', user: 'admin@example.com', timestamp: '2024-01-15 14:45:00', details: 'Updated permissions for Manager role' },
            { action: 'Security Setting Changed', user: 'admin@example.com', timestamp: '2024-01-15 13:20:00', details: 'Enabled two-factor authentication' },
            { action: 'User Deleted', user: 'admin@example.com', timestamp: '2024-01-15 12:15:00', details: 'Deleted user old.user@example.com' }
          ].map((event, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{event.action}</h4>
                  <p className="text-sm text-gray-600">by {event.user}</p>
                  <p className="text-sm text-gray-500">{event.details}</p>
                </div>
                <span className="text-sm text-gray-500">{event.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'user-activity':
        return renderUserActivityReport();
      case 'security':
        return renderSecurityReport();
      case 'system-performance':
        return renderSystemPerformanceReport();
      case 'audit-trail':
        return renderAuditTrailReport();
      default:
        return renderUserActivityReport();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FaDownload /> Export Report
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          {reportTypes.map(type => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedReport === type.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent />
                {type.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;