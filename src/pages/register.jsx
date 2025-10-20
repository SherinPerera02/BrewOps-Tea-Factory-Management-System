import axios from "axios";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import "../styles/auth-responsive.css";
import registerAnimation from "../assets/register.json";
import Spinner from "../components/Spinner";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "", // Initialize phone with an empty string to avoid uncontrolled to controlled warning
    employeeId: "", // Employee ID to match with database
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [idCheck, setIdCheck] = useState({ status: 'idle', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Validate employee ID format
  function validateEmployeeIdFormat(employeeId) {
    // Valid formats: STF000001 (staff), MNG000001 (manager)
    const pattern = /^(STF|MNG)\d{6}$/;
    return pattern.test(employeeId);
  }

  // Validate role matches employee ID prefix
  function validateRoleMatchesEmployeeId(role, employeeId) {
    const rolePrefix = {
      staff: 'STF',
      manager: 'MNG'
    };
    
    return employeeId.startsWith(rolePrefix[role] || '');
  }

  // Get role description
  function getRoleInfo(role) {
    const roleInfo = {
      staff: {
        title: "Factory Staff",
        description: "Production workers, quality controllers, and operational staff",
        requirements: "Requires STF Employee ID from factory database"
      },
      manager: {
        title: "Production Manager", 
        description: "Department managers and supervisors",
        requirements: "Requires MNG Employee ID from factory database"
      }
    };
    return roleInfo[role] || {};
  }

  // Update form state helper
  function handleChange(e) {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'employeeId') {
      nextValue = value.toUpperCase().replace(/\s+/g, '');
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (name === 'employeeId' || name === 'role') {
      setIdCheck({ status: 'idle', message: '' });
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Valid email is required";
    }

    if (!form.phone.trim() || !/^\+?[0-9]{10,15}$/.test(form.phone)) {
      newErrors.phone = "Valid phone number is required";
    }

    if (!form.password.trim() || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.role) {
      newErrors.role = "Role is required";
    }

    if (!form.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    } else if (!validateEmployeeIdFormat(form.employeeId)) {
      newErrors.employeeId = "Invalid Employee ID format (e.g., STF000001 or MNG000001)";
    } else if (form.role && !validateRoleMatchesEmployeeId(form.role, form.employeeId)) {
      newErrors.employeeId = "Employee ID doesn't match selected role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validateForm()) {
      return;
    }

    // Prevent submission while verifying employee ID, or when server indicated invalid
    if (idCheck.status === 'checking') {
      toast.error('Please wait while we verify your Employee ID');
      return;
    }
    if (idCheck.status === 'error') {
      toast.error(idCheck.message || 'Invalid Employee ID');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        employeeId: form.employeeId,
      };

      console.log("Payload being sent:", payload); // Debugging log

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/auth/register`,
        payload
      );

      // Navigate to login and show success toast there for a few seconds
      navigate("/login", { state: { showRegistrationSuccess: true } });
    } catch (error) {
      console.error("Error during registration:", error.response || error); // Debugging log
      const errorMessage = error.response?.data?.message || "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmployeeId() {
    try {
      if (!form.role || !form.employeeId || !validateEmployeeIdFormat(form.employeeId) || !validateRoleMatchesEmployeeId(form.role, form.employeeId)) {
        return;
      }
      setIdCheck({ status: 'checking', message: 'Checking employee ID…' });
      const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const res = await axios.get(`${base}/api/auth/verify-employee`, { params: { employeeId: form.employeeId, role: form.role } });
      if (res.data?.success) {
        setIdCheck({ status: 'ok', message: 'Employee ID is valid and available' });
      } else {
        setIdCheck({ status: 'error', message: res.data?.message || 'Invalid employee ID' });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to verify employee ID';
      setIdCheck({ status: 'error', message });
    }
  }

  return (
    <>
      <Toaster />
      <div className="auth-page" style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#f9fafb',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="auth-card" style={{
            width: '1300px',
            height: '650px',
            backdropFilter: 'blur(4px)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* Left half */}
            <div className="auth-left" style={{
              width: '50%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: '#dcfce7',
              padding: '32px'
            }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#16a34a',
                marginTop: '40px'
              }}>Join Us!</h1>

              <p style={{
                fontSize: '16px',
                color: '#16a34a',
                marginTop: '16px'
              }}>
                Already have an account? <br />
                <a href="/login">
                  <button
                    type="button"
                    style={{
                      marginTop: '8px',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      fontSize: '16px',
                      borderRadius: '9999px',
                      border: '1px solid #16a34a',
                      backgroundColor: 'transparent',
                      color: '#16a34a',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'black';
                      e.target.style.color = 'white';
                      e.target.style.borderColor = 'black';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#16a34a';
                      e.target.style.borderColor = '#16a34a';
                    }}
                  >
                    Login here
                  </button>
                </a>
              </p>

              {/* Animation */}
              <div style={{
                width: '100%',
                maxWidth: '300px',
                marginTop: '24px'
              }}>
                <Lottie animationData={registerAnimation} loop={true} />
              </div>
            </div>

            {/* Right half */}
            <div className="auth-right" style={{
              width: '50%',
              height: '100%',
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px',
              overflowY: 'auto',
              maxHeight: '650px'
            }}>
              <h1 style={{
                color: '#14532d',
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '12px',
                marginTop: '20px',
                flexShrink: 0
              }}>Factory Registration</h1>
              
              <div style={{
                backgroundColor: '#dcfce7',
                border: '1px solid #16a34a',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                width: '400px'
              }}>
                <p style={{ 
                  color: '#14532d', 
                  fontSize: '14px', 
                  margin: '0 0 8px 0',
                  fontWeight: 'bold'
                }}>
                  Employee Registration System
                </p>
                <p style={{ 
                  color: '#166534', 
                  fontSize: '13px', 
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  Register with your assigned employee ID from the factory database. 
                  Your employee ID must match your role to complete registration.
                </p>
              </div>

              {/* Name */}
              <div className="auth-field" style={{ width: '400px' }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  aria-label="Full Name"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'transparent',
                    color: '#166534'
                  }}
                />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="auth-field" style={{ width: '400px' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  aria-label="Email Address"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'transparent',
                    color: '#166534'
                  }}
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="auth-field" style={{ width: '400px' }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={handleChange}
                  aria-label="Phone Number"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'transparent',
                    color: '#166534'
                  }}
                />
                {errors.phone && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className="auth-field" style={{ width: '400px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    aria-label="Password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '20px',
                      margin: '10px 0',
                      paddingLeft: '16px',
                      paddingRight: '40px',
                      backgroundColor: 'transparent',
                      color: '#166534'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#166534',
                      fontSize: '20px'
                    }}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.password && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field" style={{ width: '400px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    aria-label="Confirm Password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '20px',
                      margin: '10px 0',
                      paddingLeft: '16px',
                      paddingRight: '40px',
                      backgroundColor: 'transparent',
                      color: '#166534'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#166534',
                      fontSize: '20px'
                    }}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.confirmPassword}</p>}
              </div>

              {/* Role Selection */}
              <div style={{ width: '400px' }}>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  aria-label="Role Selection"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'white',
                    color: '#166534',
                    cursor: 'pointer',
                    appearance: 'none',
                    outline: 'none'
                  }}
                >
                  <option value="" disabled>Choose a Role</option>
                  <option value="staff">Factory Staff</option>
                  <option value="manager">Production Manager</option>
                </select>
                {errors.role && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.role}</p>}
              </div>

              {/* Role Information Display */}
              {form.role && (
                <div className="auth-field" style={{
                  width: '400px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #16a34a',
                  borderRadius: '12px',
                  padding: '16px',
                  margin: '10px 0'
                }}>
                  <h4 style={{ color: '#14532d', margin: '0 0 8px 0', fontSize: '16px' }}>
                    {getRoleInfo(form.role).title}
                  </h4>
                  <p style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '14px' }}>
                    {getRoleInfo(form.role).description}
                  </p>
                  <p style={{ color: '#14532d', margin: '0', fontSize: '12px', fontWeight: 'bold' }}>
                    {getRoleInfo(form.role).requirements}
                  </p>
                </div>
              )}

              {/* Employee ID Input */}
              <div className="auth-field" style={{ width: '400px', position: 'relative' }}>
                <input
                  type="text"
                  name="employeeId"
                  placeholder={form.role ? 
                    `Enter your ${form.role === 'staff' ? 'STF' : 'MNG'} Employee ID` : 
                    "Employee ID (e.g., STF000001 or MNG000001)"}
                  value={form.employeeId}
                  onChange={handleChange}
                  aria-label="Employee ID"
                  disabled={loading}
                  onBlur={handleVerifyEmployeeId}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: form.employeeId && validateEmployeeIdFormat(form.employeeId) && validateRoleMatchesEmployeeId(form.role, form.employeeId)
                      ? '2px solid #16a34a' 
                      : errors.employeeId 
                        ? '2px solid #ef4444' 
                        : '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '40px',
                    backgroundColor: 'transparent',
                    color: '#166534',
                    textTransform: 'uppercase'
                  }}
                />
                {form.employeeId && validateEmployeeIdFormat(form.employeeId) && validateRoleMatchesEmployeeId(form.role, form.employeeId) && (
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#16a34a',
                    fontSize: '18px'
                  }}>
                    ✓
                  </div>
                )}
                {errors.employeeId && <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.employeeId}</p>}
                
                {/* Role mismatch warning */}
                {form.employeeId && validateEmployeeIdFormat(form.employeeId) && !validateRoleMatchesEmployeeId(form.role, form.employeeId) && (
                  <p style={{ color: '#f59e0b', fontSize: '13px', margin: '5px 0 0 0' }}>
                    Employee ID doesn't match selected role
                  </p>
                )}

                {/* Employee ID server verification status */}
                {idCheck.status !== 'idle' && !errors.employeeId && validateEmployeeIdFormat(form.employeeId) && validateRoleMatchesEmployeeId(form.role, form.employeeId) && (
                  <p style={{
                    color: idCheck.status === 'ok' ? '#16a34a' : idCheck.status === 'checking' ? '#2563eb' : '#ef4444',
                    fontSize: '13px',
                    margin: '6px 0 0 0'
                  }}>
                    {idCheck.message}
                  </p>
                )}
              </div>

              {/* Employee ID Validation Status */}
              {form.employeeId && (
                <div className="auth-field" style={{ width: '400px' }}>
                  <div style={{
                    width: '100%',
                    height: '50px',
                    border: '2px solid #16a34a',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    Your Employee ID: {form.employeeId}
                  </div>
                </div>
              )}

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={loading || idCheck.status === 'checking'}
                style={{
                  width: '400px',
                  height: '50px',
                  backgroundColor: (loading || idCheck.status === 'checking') ? '#9ca3af' : '#166534',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  cursor: (loading || idCheck.status === 'checking') ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '16px',
                  marginBottom: '20px',
                  border: 'none',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!loading && idCheck.status !== 'checking') {
                    e.target.style.backgroundColor = 'black';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && idCheck.status !== 'checking') {
                    e.target.style.backgroundColor = '#166534';
                    e.target.style.color = 'white';
                  }
                }}
              >
                {loading || idCheck.status === 'checking' ? <Spinner /> : "Register"}
              </button>

              {/* Registration Info */}
              <div style={{
                width: '400px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '0' }}>
                  Registration requires valid employee ID from factory database
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
