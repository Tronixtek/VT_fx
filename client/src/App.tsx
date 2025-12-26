import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from './redux/store';
import { getProfile } from './redux/slices/authSlice';
import socketService from './lib/socket';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';
import PaymentVerificationPage from './pages/PaymentVerificationPage';

// User Dashboard
import UserDashboard from './pages/user/Dashboard';
import SignalsPage from './pages/user/SignalsPage';
import CoursesPage from './pages/user/CoursesPage';
import CourseDetailPage from './pages/user/CourseDetailPage';
import MentorshipPage from './pages/user/MentorshipPage';
import SettingsPage from './pages/user/SettingsPage';
import SimulatorPage from './pages/user/SimulatorPage';
import PerformancePage from './pages/user/PerformancePage';

// Analyst Dashboard
import AnalystDashboard from './pages/analyst/Dashboard';
import CreateSignalPage from './pages/analyst/CreateSignalPage';
import BookingsPage from './pages/analyst/BookingsPage';
import MySignalsPage from './pages/analyst/MySignalsPage';

// Admin Dashboard
import AdminDashboard from './pages/admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import CoursesManagement from './pages/admin/CoursesManagement';
import LessonManagement from './pages/admin/LessonManagement';
import PaymentsManagement from './pages/admin/PaymentsManagement';

import './index.css';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getProfile());
      socketService.connect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>

        {/* Payment Routes */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/verify" element={<PaymentVerificationPage />} />

        {/* User Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="mentorship" element={<MentorshipPage />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Analyst Dashboard */}
        <Route
          path="/analyst"
          element={
            <ProtectedRoute allowedRoles={['analyst', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AnalystDashboard />} />
          <Route path="create-signal" element={<CreateSignalPage />} />
          <Route path="signals/create" element={<CreateSignalPage />} />
          <Route path="signals" element={<MySignalsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
        </Route>

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="courses" element={<CoursesManagement />} />
          <Route path="courses/:courseId/lessons" element={<LessonManagement />} />
          <Route path="payments" element={<PaymentsManagement />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
