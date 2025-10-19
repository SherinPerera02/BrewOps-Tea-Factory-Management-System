import React, { useState, useEffect } from 'react';
import { FaUsers, FaShieldAlt, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const RolePermissions = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });

  useEffect(() => {
    // Mock data - replace with actual API calls
    setRoles([
      { id: 1, name: 'Admin', description: 'Full system access', userCount: 2, permissions: ['create', 'read', 'update', 'delete'] },
      { id: 2, name: 'Manager', description: 'Management level access', userCount: 5, permissions: ['create', 'read', 'update'] },
      { id: 3, name: 'Staff', description: 'Basic staff access', userCount: 15, permissions: ['read', 'update'] },
      { id: 4, name: 'Viewer', description: 'Read-only access', userCount: 8, permissions: ['read'] }
    ]);

    setPermissions([
      { id: 'create', name: 'Create', description: 'Create new records' },
      { id: 'read', name: 'Read', description: 'View records' },
      { id: 'update', name: 'Update', description: 'Modify existing records' },
      { id: 'delete', name: 'Delete', description: 'Remove records' }
    ]);
  }, []);

  const handleCreateRole = () => {
    if (newRole.name && newRole.description) {
      const role = {
        id: roles.length + 1,
        ...newRole,
        userCount: 0
      };
      setRoles([...roles, role]);
      setNewRole({ name: '', description: '', permissions: [] });
      setShowCreateRole(false);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    const updatedPermissions = newRole.permissions.includes(permissionId)
      ? newRole.permissions.filter(p => p !== permissionId)
      : [...newRole.permissions, permissionId];
    
    setNewRole({ ...newRole, permissions: updatedPermissions });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Role & Permissions Management</h1>
        <button
          onClick={() => setShowCreateRole(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                <p className="text-gray-600 text-sm">{role.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-blue-500 hover:text-blue-700">
                  <FaEdit />
                </button>
                <button className="text-red-500 hover:text-red-700">
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <FaUsers className="text-gray-500" />
              <span className="text-sm text-gray-600">{role.userCount} users</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Permissions:</h4>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map(permission => (
                  <span
                    key={permission}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Available Permissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissions.map(permission => (
                <tr key={permission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaShieldAlt className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {permission.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {permissions.map(permission => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{permission.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateRole(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissions;