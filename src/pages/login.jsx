import axios from "axios";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import loginAnimation from "../assets/login.json";
import Lottie from "lottie-react";
import Spinner from "../components/Spinner";
import React, { useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownRegSuccess = useRef(false);

  // Destructure the pieces of location we care about so we can list them explicitly in deps
  const pathname = location.pathname;
  const showRegistrationSuccess = location.state?.showRegistrationSuccess;

  useEffect(() => {
    // Show one-time toast after successful registration (guarded for React 18 StrictMode)
    if (showRegistrationSuccess && !hasShownRegSuccess.current) {
      hasShownRegSuccess.current = true;
      toast.success("Registration successful! Please sign in.", {
        duration: 3000,
        position: "top-center",
      });
      // Replace state so the toast doesn't show again on back/refresh
      navigate(pathname, { replace: true, state: {} });
    }

    // Initialize Remember Me and saved email
    try {
      const savedRemember = localStorage.getItem('rememberMe') === 'true';
      const savedEmail = savedRemember ? localStorage.getItem('rememberedEmail') || '' : '';
      setRememberMe(savedRemember);
      if (savedRemember && savedEmail) setEmail(savedEmail);
    } catch {}

    // Simulate loading delay (e.g., fetching config, preloading images)
    const timer = setTimeout(() => {
      setLoadingPage(false);
    }, 800); // 1.5 sec delay
    return () => clearTimeout(timer);
  }, [pathname, showRegistrationSuccess, navigate]);

  // Keep remembered email in sync when toggled or edited
  useEffect(() => {
    try {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        if (email) localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.setItem('rememberMe', 'false');
        localStorage.removeItem('rememberedEmail');
      }
    } catch {}
  }, [rememberMe, email]);

  if (loadingPage) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <Spinner />
      </div>
    );
  }

  function validateLoginForm() {
    const newErrors = {};

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Valid email is required";
      toast.error("Please enter a valid email address", {
        duration: 4000,
        position: "top-right",
        style: {
          
          padding: "16px",
          color: "#ff0000",
        },
        
      });
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      toast.error("Password cannot be empty", {
        duration: 4000,
        position: "top-right",
        style: {
          
          padding: "16px",
          color: "#ff0000",
        },
        
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validateLoginForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/auth/login`,
        {
          email,
          password,
        }
      );

      // Save token based on Remember Me
      const token = response.data && response.data.token;
      const userData = response.data.user;
      
      if (token) {
        try {
          if (rememberMe) {
            localStorage.setItem('jwtToken', token);
            sessionStorage.removeItem('jwtToken');
            // persist email for convenience
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberMe', 'true');
          } else {
            sessionStorage.setItem('jwtToken', token);
            localStorage.removeItem('jwtToken');
            localStorage.setItem('rememberMe', 'false');
            localStorage.removeItem('rememberedEmail');
          }
        } catch {}
      }

      // Save user data (name and role) for display throughout the app
      if (userData) {
        try {
          const userInfo = {
            name: userData.name,
            role: userData.role,
            email: userData.email,
            id: userData.id
          };
          // include must_change_password flag if present
          if (typeof userData.must_change_password !== 'undefined') {
            userInfo.must_change_password = Number(userData.must_change_password) || 0;
          } else if (typeof response.data.user?.must_change_password !== 'undefined') {
            userInfo.must_change_password = Number(response.data.user.must_change_password) || 0;
          } else {
            userInfo.must_change_password = 0;
          }
          
          if (rememberMe) {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            sessionStorage.removeItem('userInfo');
          } else {
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.removeItem('userInfo');
          }
        } catch {}
      }

      // Show toast message before navigating
      toast.success("Login Successful! Redirecting", {
        duration: 3000, // Stay for 3 seconds
        position: "top-center",
        style: {
          
          padding: "16px",
          color: "#4caf50",
        },
        
      });

      // Get role from response
      const role = userData ? userData.role : response.data.role;

      // Delay navigation until the toast message is shown
      setTimeout(() => {
        if (role === "supplier") {
          navigate("/supplier-dashboard");
        } else if (role === "staff") {
          navigate("/staff-dashboard");
        } else if (role === "manager" || role === "production_manager") {
          navigate("/production-manager-dashboard");
        } else if (role === "admin") {
          navigate("/admin");
        }
      }, 0);
    } catch (e) {
      console.error("Login error:", e);
      const msg = e.response?.data?.message || "Invalid email or password";
      toast.error(msg, { position: "top-center" });

    } finally {
      setIsSubmitting(false);
    }
  }



  return (
    <>
      <Toaster />
      <div style={{
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
          <div style={{
            width: '1300px',
            height: '600px',
            backdropFilter: 'blur(4px)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* Left half */}
            <div style={{
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
                marginTop: '30px'
              }}>
                Welcome BrewOps
              </h1>

              <p style={{
                fontSize: '16px',
                color: '#16a34a',
                marginTop: '16px'
              }}>
                Don't have an account yet?{" "}
                <br />
                <a href="/register">
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
                    Register here
                  </button>
                </a>
              </p>

              {/* Animation below register */}
              <div style={{
                width: '100%',
                maxWidth: '300px',
                marginTop: '24px'
              }}>
                <Lottie animationData={loginAnimation} loop={true} />
              </div>
            </div>

            {/* Right half */}
            <div style={{
              width: '50%',
              height: '100%',
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px'
            }}>
              <h1 style={{
                color: '#166534',
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '24px'
              }}>Sign In</h1>

              <div style={{ width: '400px' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: errors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'transparent',
                    color: '#166534',
                    fontSize: '16px'
                  }}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.email}</p>
                )}
              </div>

              <div style={{ width: '400px', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: errors.password ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '20px',
                    margin: '10px 0',
                    paddingLeft: '16px',
                    paddingRight: '44px',
                    backgroundColor: 'transparent',
                    color: '#166534',
                    fontSize: '16px'
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.password && (
                  <p style={{ color: '#ef4444', fontSize: '14px' }}>{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{
                width: '400px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                color: '#166534',
                marginTop: '8px',
                marginBottom: '16px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    style={{
                      appearance: 'none',
                      width: '16px',
                      height: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: rememberMe ? '#1cbb3f' : 'transparent',
                      borderColor: rememberMe ? '#1cbb3f' : '#d1d5db',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      backgroundImage: rememberMe
                        ? "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22white%22><path d=%22M7.629 15.314L3.314 11l1.414-1.414L7.629 12.486l7.643-7.643 1.414 1.414z%22/></svg>')"
                        : "none",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "70%",
                    }}
                  />
                  <span style={{ color: '#166534' }}>Remember Me</span>
                </label>
                <span
                  style={{
                    color: '#166534',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot your password?
                </span>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleLogin}
                style={{
                  width: '400px',
                  height: '50px',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#166534',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  border: 'none'
                }}
                disabled={isSubmitting}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = 'black';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#166534';
                    e.target.style.color = 'white';
                  }
                }}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


