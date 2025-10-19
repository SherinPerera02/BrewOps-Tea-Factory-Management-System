import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Import pages
import HomePage from "./pages/homePage";
import Login from "./pages/login";
import Register from "./pages/register";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierChangePassword from "./pages/supplierChangePassword";
import StaffDashboard from "./pages/StaffDashboard";
import ProductionManagerDashboard from "./pages/ProductionManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import CreateInventory from "./components/createInventory";
import ShowInventory from "./components/showInventory";
import EditInventory from "./components/editInventory";
import InventoryReports from "./components/InventoryReports";
import SupplyRecords from "./components/SupplyRecords";
import PaymentPage from "./pages/PaymentPage";
import PaymentResult from "./pages/PaymentResult";
import ForgotPassword from "./pages/forgetPassword";

// Protected Route Component - DEVELOPMENT MODE (Security Disabled)
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // For development: Allow direct access to all routes without authentication
  return children;
};

// Public Route Component - DEVELOPMENT MODE (Security Disabled)
const PublicRoute = ({ children }) => {
  // For development: Allow direct access without redirecting logged-in users
  return children;
};

function AppWrapper() {
  // useLocation must be inside Router; we create a wrapper that reads location
  const location = useLocation();
  // If a background location is set in navigation state, render routes for the background
  const background = location.state && location.state.background;
  // If user navigates directly to the modal URL, show ProductionManagerDashboard as background
  const isDirectCreateModal =
    location.pathname === "/create-inventory" && !background;

  // Choose the location that the main Routes should render: either the background, or
  // when visiting /create-inventory directly, render the production manager dashboard as the background.
  const mainRoutesLocation =
    background ||
    (isDirectCreateModal
      ? { pathname: "/production-manager-dashboard" }
      : location);

  return (
    <div className="App">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#ffffff",
            color: "#1f2937",
            zIndex: 99999,
            fontSize: "16px",
            fontWeight: "500",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            minWidth: "300px",
            textAlign: "center",
          },
          success: {
            duration: 4000,
            style: {
              background: "#10b981",
              color: "#ffffff",
              border: "1px solid #059669",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
              color: "#ffffff",
              border: "1px solid #dc2626",
              boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
            },
          },
        }}
        containerStyle={{
          zIndex: 99999,
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
        gutter={12}
      />

      <Routes location={mainRoutesLocation}>
        {/* Home Page - Landing page with hero, stats, tours, CTA, footer */}
        <Route path="/" element={<HomePage />} />

        {/* Public Routes - DEVELOPMENT MODE: Direct Access */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard Routes - DEVELOPMENT MODE: Direct Access */}
        <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
        <Route
          path="/supplier-change-password"
          element={<SupplierChangePassword />}
        />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/supply-records" element={<SupplyRecords />} />
        <Route path="/payment/:recordId" element={<PaymentPage />} />
        <Route path="/payment-result/:type" element={<PaymentResult />} />
        <Route
          path="/production-manager-dashboard"
          element={<ProductionManagerDashboard />}
        />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/inventory-reports" element={<InventoryReports />} />

        {/* Catch all route - Redirect to home page */}
        <Route path="*" element={<HomePage />} />
      </Routes>

      {/* Render the CreateInventory modal on top when either we navigated with a background
            or when the user visited /create-inventory directly (we render the dashboard as background). */}
      {(background || isDirectCreateModal) && (
        <Routes>
          <Route path="/create-inventory" element={<CreateInventory />} />
          <Route path="/inventory/:id" element={<ShowInventory />} />
          <Route path="/inventory/edit/:id" element={<EditInventory />} />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
