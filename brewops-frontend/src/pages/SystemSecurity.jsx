import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaEye, FaLock } from 'react-icons/fa';

const SystemSecurity = () => {
  const [securityStatus, setSecurityStatus] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({});

  useEffect(() => {
    // Mock data - replace with actual API calls
    setSecurityStatus({
      overallScore: 85,
      firewall: 'Active',
      encryption: 'Enabled',
      lastScan: '2024-01-15 14:30:00',
      threats: 3,
      vulnerabilities: 1
    });

    setAlerts([
      {
        id: 1,
        type: 'warning',
        title: 'Multiple Failed Login Attempts',
        description: 'User admin@example.com has 5 failed login attempts in the last hour',
        timestamp: '2024-01-15 15:45:00',
        severity: 'medium'
      },
      {
        id: 2,
        type: 'error',
        title: 'Suspicious Network Activity',
        description: 'Unusual traffic patterns detected from IP 192.168.1.100',
        timestamp: '2024-01-15 15:30:00',
        severity: 'high'
      },
      {
        id: 3,
        type: 'info',
        title: 'Security Update Available',
        description: 'New security patches are available for the system',
        timestamp: '2024-01-15 14:15:00',
        severity: 'low'
      }
    ]);

    setSecuritySettings({
      twoFactorAuth: true,
      passwordPolicy: true,
      sessionTimeout: 30,
      loginAttempts: 5,
      ipWhitelist: true
    });
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <FaTimesCircle className="text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'info':
        return <FaCheckCircle className="text-blue-500" />;
      default:
        return <FaExclamationTriangle className="text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">System Security</h1>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Security Score</p>
              <p className="text-2xl font-bold text-green-600">{securityStatus.overallScore}%</p>
            </div>
            <FaShieldAlt className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Threats</p>
              <p className="text-2xl font-bold text-red-600">{securityStatus.threats}</p>
            </div>
            <FaExclamationTriangle className="text-3xl text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vulnerabilities</p>
              <p className="text-2xl font-bold text-yellow-600">{securityStatus.vulnerabilities}</p>
            </div>
            <FaTimesCircle className="text-3xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Firewall Status</p>
              <p className="text-lg font-semibold text-green-600">{securityStatus.firewall}</p>
            </div>
            <FaLock className="text-3xl text-green-500" />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Security Alerts</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{alert.description}</p>
                  <p className="text-sm text-gray-500">{alert.timestamp}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <FaEye />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Require 2FA for all users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      twoFactorAuth: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Strong Password Policy</h3>
                  <p className="text-sm text-gray-500">Enforce complex passwords</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.passwordPolicy}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">IP Whitelist</h3>
                  <p className="text-sm text-gray-500">Restrict access by IP address</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.ipWhitelist}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      ipWhitelist: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    sessionTimeout: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={securitySettings.loginAttempts}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    loginAttempts: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md">
                Save Security Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSecurity;