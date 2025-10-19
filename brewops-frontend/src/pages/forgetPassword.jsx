import axios from "axios";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import loginAnimation from "../assets/login.json";
import Lottie from "lottie-react";
import Spinner from "../components/Spinner";
import { ArrowLeft, Mail, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoadingPage(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loadingPage) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
        }}
      >
        <Spinner />
      </div>
    );
  }

  function validateEmail() {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
      toast.error("Please enter your email address", {
        duration: 4000,
        position: "top-right",
        style: {
          padding: "16px",
          color: "#ff0000",
        },
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      toast.error("Please enter a valid email address", {
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

  async function handleForgotPassword() {
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      await axios.post(`${base}/api/users/send-otp`, { email });

      setEmailSent(true);
      toast.success("Password reset email sent!", {
        duration: 4000,
        position: "top-center",
        style: {
          padding: "16px",
          color: "#4caf50",
        },
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email. Please try again.", {
        duration: 4000,
        position: "top-center",
        style: {
          padding: "16px",
          color: "#ff0000",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  function validateResetForm() {
    const e = {};
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      e.otp = "Enter the 6-digit OTP";
    }
    if (!newPassword || newPassword.length < 6) {
      e.newPassword = "New password must be at least 6 characters";
    }
    if (newPassword !== confirmNewPassword) {
      e.confirmNewPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleResetPassword() {
    if (!validateResetForm()) return;
    setIsSubmitting(true);
    try {
      const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      await axios.post(`${base}/api/users/reset-password`, {
        email,
        otp: otp.trim(),
        newPassword,
      });
      toast.success("Password has been reset. Please login.");
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to reset password";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Toaster />
      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#f9fafb",
          backgroundPosition: "center",
          backgroundSize: "cover",
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "1300px",
              height: "600px",
              backdropFilter: "blur(4px)",
              borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* Left half */}
            <div
              style={{
                width: "50%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                backgroundColor: "#dcfce7",
                padding: "32px",
              }}
            >
              <h1
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#16a34a",
                  marginTop: "40px",
                }}
              >
                Reset Password
              </h1>

              <p
                style={{
                  fontSize: "16px",
                  color: "#16a34a",
                  marginTop: "16px",
                }}
              >
                Enter your email and we'll send you a OTP.
              </p>

              {/* Animation */}
              <div style={{ width: "100%", maxWidth: "300px", marginTop: "24px" }}>
                <Lottie animationData={loginAnimation} loop={true} />
              </div>
            </div>

            {/* Right half */}
            <div
              style={{
                width: "50%",
                height: "100%",
                backgroundColor: "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              {/* Back to Login Button */}
              <div
                style={{
                  width: "400px",
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <button
                  onClick={handleBackToLogin}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#14532d",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#16a34a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#14532d")}
                >
                  <ArrowLeft size={20} style={{ color: "inherit" }} />
                  <span>Back to Login</span>
                </button>
              </div>

              {!emailSent ? (
                <>
                  <h1
                    style={{
                      color: "#14532d",
                      fontSize: "36px",
                      fontWeight: "bold",
                      marginBottom: "24px",
                    }}
                  >
                    Forgot Password?
                  </h1>
                  
                  <p
                    style={{
                      color: "#6b7280",
                      textAlign: "center",
                      marginBottom: "24px",
                      width: "400px",
                    }}
                  >
                    Enter your email address and we'll send you a OTP.
                  </p>

                  <div style={{ width: "400px" }}>
                    <div style={{ position: "relative" }}>
                      <Mail
                        size={20}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#9ca3af",
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        style={{
                          width: "100%",
                          height: "50px",
                          border: errors.email ? "2px solid #ef4444" : "1px solid #d1d5db",
                          borderRadius: "20px",
                          margin: "10px 0",
                          paddingLeft: "48px",
                          paddingRight: "16px",
                          backgroundColor: "transparent",
                          color: "#166534",
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px" }}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Send Reset Email Button */}
                  <button
                    onClick={handleForgotPassword}
                    disabled={isSubmitting}
                    style={{
                      width: "400px",
                      height: "50px",
                      backgroundColor: isSubmitting ? "#9ca3af" : "#166534",
                      borderRadius: "20px",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "white",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      marginTop: "16px",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = "black";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = "#166534";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Email"}
                  </button>
                </>
              ) : (
                // Success State
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                    <CheckCircle size={48} style={{ color: "#22c55e" }} />
                  </div>
                  <h2 style={{ color: "#14532d", fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
                    OTP Sent!
                  </h2>
                  <p style={{ color: "#6b7280", textAlign: "center", marginBottom: "16px", width: "400px" }}>
                    We sent a 6-digit code to <strong>{email}</strong>. Enter it below with your new password.
                  </p>

                  {/* OTP */}
                  <div style={{ width: "400px" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      style={{
                        width: "100%",
                        height: "50px",
                        border: errors.otp ? "2px solid #ef4444" : "1px solid #d1d5db",
                        borderRadius: "20px",
                        margin: "10px 0",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        backgroundColor: "transparent",
                        color: "#166534",
                        letterSpacing: "2px",
                        textAlign: "center",
                      }}
                      disabled={isSubmitting}
                    />
                    {errors.otp && (
                      <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px" }}>{errors.otp}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div style={{ width: "400px", position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        height: "50px",
                        border: errors.newPassword ? "2px solid #ef4444" : "1px solid #d1d5db",
                        borderRadius: "20px",
                        margin: "10px 0",
                        paddingLeft: "16px",
                        paddingRight: "44px",
                        backgroundColor: "transparent",
                        color: "#166534",
                      }}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowNewPassword((s) => !s)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                      }}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    {errors.newPassword && (
                      <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px" }}>{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div style={{ width: "400px", position: "relative" }}>
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        height: "50px",
                        border: errors.confirmNewPassword ? "2px solid #ef4444" : "1px solid #d1d5db",
                        borderRadius: "20px",
                        margin: "10px 0",
                        paddingLeft: "16px",
                        paddingRight: "44px",
                        backgroundColor: "transparent",
                        color: "#166534",
                      }}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmNewPassword((s) => !s)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                      }}
                    >
                      {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    {errors.confirmNewPassword && (
                      <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "4px" }}>{errors.confirmNewPassword}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <button
                      onClick={handleResetPassword}
                      disabled={isSubmitting}
                      style={{
                        width: "400px",
                        height: "50px",
                        backgroundColor: isSubmitting ? "#9ca3af" : "#166534",
                        borderRadius: "20px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "white",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        border: "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = "black";
                          e.currentTarget.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = "#166534";
                          e.currentTarget.style.color = "white";
                        }
                      }}
                    >
                      Reset Password
                    </button>

                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                        setOtp("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setErrors({});
                      }}
                      style={{
                        width: "400px",
                        height: "50px",
                        border: "1px solid #166534",
                        borderRadius: "20px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#166534",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0fdf4";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Try Different Email
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Help */}
              {!emailSent && (
                <div style={{ width: "400px", textAlign: "center", marginTop: "24px" }}>
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>
                    Remember your password?{" "}
                    <Link
                      to="/login"
                      style={{ color: "#166534", fontWeight: 500, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}