import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    id: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      if (!token) {
        setMessage('Please log in to view your profile');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          role: result.data.role || '',
          id: result.data.id || ''
        });
      } else {
        setMessage(result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!user.name.trim()) {
      setMessage('Name is required');
      return false;
    }
    if (!user.email.trim()) {
      setMessage('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(user.email)) {
      setMessage('Please enter a valid email address');
      return false;
    }
    if (user.phone && !/^\+?[\d\s\-\(\)]+$/.test(user.phone)) {
      setMessage('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const updateData = {
        name: user.name,
        email: user.email,
        phone: user.phone
      };

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        
        // Update stored user info with new data
        const userInfo = {
          name: user.name,
          role: user.role,
          email: user.email,
          id: user.id
        };
        
        if (localStorage.getItem('jwtToken')) {
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } else if (sessionStorage.getItem('jwtToken')) {
          sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
        
        // Trigger a page refresh or emit event to update UI
        window.dispatchEvent(new Event('userProfileUpdated'));
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage(''); // Clear message when user starts typing
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Edit Profile</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="profile-modal-content">
          {loading ? (
            <div className="loading">Loading profile...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={user.phone}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </div>

              {message && (
                <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="save-button" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;