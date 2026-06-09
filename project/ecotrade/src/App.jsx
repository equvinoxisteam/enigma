import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ToastContainer from "./components/ui/ToastContainer";
import ScrollToTop from "./components/ScrollToTop";
import { Provider } from "react-redux";
import { store } from "./store/store";
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth Pages
import RoleSelectionPage from "./pages/auth/RoleSelectionPage";
import LoginPage from "./pages/auth/LoginPage";
import EnigmaRegisterPage from "./pages/auth/EnigmaRegisterPage";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Dashboard Pages
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import StartRFQPage from "./pages/StartRFQPage";
import RFQPoolPage from "./pages/RFQPoolPage";
import RFQDetailPage from "./pages/RFQDetailPage";
import MyRFQsPage from "./pages/MyRFQsPage";
import MyRFQDetailPage from "./pages/MyRFQDetailPage";
import AcceptedRFQsPage from "./pages/AcceptedRFQsPage";
import AcceptedRFQDetailPage from "./pages/AcceptedRFQDetailPage";
import InvitationsPage from "./pages/InvitationsPage";
import PricingPage from "./pages/PricingPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import ManufacturersPoolPage from "./pages/ManufacturersPoolPage";
import MyManufacturersPage from "./pages/MyManufacturersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DebugPage from "./pages/DebugPage";
import TestLogin from "./pages/TestLogin";
import QuickRegister from "./pages/QuickRegister";
import ManufacturerProfilePage from "./pages/ManufacturerProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedAdminRoute from "./pages/admin/ProtectedAdminRoute";
import { useAuth } from "./contexts/AuthContext";

// Root Route Component to handle default redirect based on auth status
const RootRedirect = () => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (isAuthenticated || (token && user)) {
    try {
      const userData = JSON.parse(user || '{}');
      if (userData.isAdmin) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    } catch (e) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return <Navigate to="/role-selection" replace />;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  // Check if user has both token and user data
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Try to parse user data to ensure it's valid
  try {
    JSON.parse(storedUser);
    return children;
  } catch (error) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

const RoleProtectedRoute = ({ children, allowedUserTypes }) => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (!allowedUserTypes.includes(user.userType)) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  } catch (error) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/role-selection" element={<RoleSelectionPage />} />
              <Route path="/register" element={<EnigmaRegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/verify-email"
                element={<EmailVerificationPage />}
              />
              <Route
                path="/verify-email/:token"
                element={<EmailVerificationPage />}
              />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/start-rfq"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['BUYER', 'HYBRID']}>
                      <DashboardLayout>
                        <StartRFQPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rfqs-pool"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['MANUFACTURER', 'HYBRID']}>
                      <DashboardLayout>
                        <RFQPoolPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rfqs-pool/:id"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['MANUFACTURER', 'HYBRID']}>
                      <DashboardLayout>
                        <RFQDetailPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rfqs/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MyRFQDetailPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rfqs"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MyRFQsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accepted-rfqs"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['MANUFACTURER', 'HYBRID']}>
                      <DashboardLayout>
                        <AcceptedRFQsPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accepted-rfqs/:id"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['MANUFACTURER', 'HYBRID']}>
                      <DashboardLayout>
                        <AcceptedRFQDetailPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invitations"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['MANUFACTURER', 'HYBRID']}>
                      <DashboardLayout>
                        <InvitationsPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['MANUFACTURER', 'HYBRID']}>
                      <DashboardLayout>
                        <AnalyticsPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturers-pool"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['BUYER', 'HYBRID']}>
                      <DashboardLayout>
                        <ManufacturersPoolPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-manufacturers"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedUserTypes={['BUYER', 'HYBRID']}>
                      <DashboardLayout>
                        <MyManufacturersPage />
                      </DashboardLayout>
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ManufacturerProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <PricingPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <HelpPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Debug Page (Public for testing) */}
              <Route path="/debug" element={<DebugPage />} />
              
              {/* Test Login Page (Public for testing) */}
              <Route path="/test-login" element={<TestLogin />} />
              
              {/* Quick Register Page (Public for testing) */}
              <Route path="/quick-register" element={<QuickRegister />} />

              {/* Default redirect */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
            <ToastContainer />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
