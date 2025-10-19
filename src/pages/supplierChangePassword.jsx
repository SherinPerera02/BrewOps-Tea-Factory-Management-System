import React, { useState } from 'react';
import toast from 'react-hot-toast';
import NavigationBar from '../components/navigationBar';
import Footer from '../components/footer';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SupplierChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Please fill all fields');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // include current stored name/email so backend validation passes
      const stored = JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}');
      const name = stored.name || '';
      const email = stored.email || '';
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword, name, email })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Password changed successfully');
        // Clear must_change_password flag in stored user info
        try {
          const ls = localStorage.getItem('userInfo');
          const ss = sessionStorage.getItem('userInfo');
          if (ls) {
            const u = JSON.parse(ls);
            u.must_change_password = 0;
            localStorage.setItem('userInfo', JSON.stringify(u));
          }
          if (ss) {
            const u = JSON.parse(ss);
            u.must_change_password = 0;
            sessionStorage.setItem('userInfo', JSON.stringify(u));
          }
        } catch (err) {}
        // Optionally redirect to dashboard
        window.location.href = '/supplier-dashboard';
      } else {
        toast.error(json.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error', err);
      toast.error('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavigationBar />
      <div style={{ maxWidth: 680, margin: '40px auto', padding: 20 }}>
        <h2>Change Password</h2>
        <p>Use the temporary password you received by email as "Current password" and choose a new password.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label>Current password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ flex: 1 }} />
            <button type="button" onClick={() => setShowCurrent(s => !s)} aria-label="Toggle current password visibility" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              {showCurrent ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <label>New password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ flex: 1 }} />
            <button type="button" onClick={() => setShowNew(s => !s)} aria-label="Toggle new password visibility" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <label>Confirm new password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ flex: 1 }} />
            <button type="button" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle confirm password visibility" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => window.location.href = '/supplier-dashboard'}>Cancel</button>
            <button type="submit" style={{ background: '#059669', color: '#fff', padding: '8px 12px' }} disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
