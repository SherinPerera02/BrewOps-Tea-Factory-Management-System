// Utility functions for authentication and user management

/**
 * Get authentication token from storage
 * Checks both localStorage and sessionStorage for 'jwtToken' and 'token' keys
 * @returns {string|null} Token or null if not found
 */
export const getAuthToken = () => {
  // Check for jwtToken first (preferred key)
  const jwtToken =
    localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
  if (jwtToken) return jwtToken;

  // Fallback to 'token' key for backward compatibility
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token || null;
};

/**
 * Decode JWT token to get user information
 * @returns {Object|null} User object or null if no valid token
 */
export const getCurrentUser = () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    // Decode JWT token (simple base64 decode for payload)
    const payload = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payload));

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decodedPayload.exp && decodedPayload.exp < currentTime) {
      // Token is expired, remove it from all storage locations
      localStorage.removeItem("jwtToken");
      sessionStorage.removeItem("jwtToken");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      return null;
    }

    return {
      id: decodedPayload.id,
      email: decodedPayload.email,
      role: decodedPayload.role,
      name: decodedPayload.name,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    // If token is invalid, remove it from all storage locations
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("jwtToken");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    return null;
  }
};

/**
 * Get current user ID
 * @returns {number|null} User ID or null if not logged in
 */
export const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user ? user.id : null;
};

/**
 * Get current user role
 * @returns {string|null} User role or null if not logged in
 */
export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
export const isLoggedIn = () => {
  return getCurrentUser() !== null;
};

/**
 * Logout user by removing token from all storage locations
 */
export const logout = () => {
  localStorage.removeItem("jwtToken");
  sessionStorage.removeItem("jwtToken");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("userInfo");
  sessionStorage.removeItem("userInfo");
  window.location.href = "/login";
};
