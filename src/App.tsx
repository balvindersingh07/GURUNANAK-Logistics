import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
import DashboardLayout, { getDashboardPath } from './components/layout/DashboardLayout';
import RoleGuard, { RoutePermissionGuard } from './components/auth/RoleGuard';
import type { UserRole } from './types';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const DeliveriesPage = lazy(() => import('./pages/admin/DeliveriesPage'));
const CreateDeliveryPage = lazy(() => import('./pages/admin/CreateDeliveryPage'));
const DeliveryDetailsPage = lazy(() => import('./pages/admin/DeliveryDetailsPage'));
const LiveTrackingPage = lazy(() => import('./pages/admin/LiveTrackingPage'));
const FleetPage = lazy(() => import('./pages/admin/FleetPage'));
const FleetDetailsPage = lazy(() => import('./pages/admin/FleetDetailsPage'));
const DriversPage = lazy(() => import('./pages/admin/DriversPage'));
const DriverProfilePage = lazy(() => import('./pages/admin/DriverProfilePage'));
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'));
const CustomerDetailsPage = lazy(() => import('./pages/admin/CustomerDetailsPage'));
const RoutesPage = lazy(() => import('./pages/admin/RoutesPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

const CustomerDashboardPage = lazy(() => import('./pages/customer/CustomerDashboardPage'));
const CustomerTrackingPage = lazy(() => import('./pages/customer/CustomerTrackingPage'));

const DriverDashboardPage = lazy(() => import('./pages/driver/DriverDashboardPage'));
const DriverDeliveryPage = lazy(() => import('./pages/driver/DriverDeliveryPage'));

const SupportPage = lazy(() => import('./pages/shared/SupportPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  );
}

function RootRedirect() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}

const opsRoles: UserRole[] = ['admin', 'dispatcher'];
const adminOnlyRoles: UserRole[] = ['admin'];

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<DashboardLayout />}>
          <Route element={<RoutePermissionGuard />}>
            <Route element={<RoleGuard allowedRoles={opsRoles} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/deliveries/new" element={<CreateDeliveryPage />} />
              <Route path="/deliveries/create" element={<CreateDeliveryPage />} />
              <Route path="/deliveries/:id" element={<DeliveryDetailsPage />} />
              <Route path="/tracking" element={<LiveTrackingPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<RoleGuard allowedRoles={adminOnlyRoles} />}>
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/fleet/:id" element={<FleetDetailsPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/drivers/:id" element={<DriverProfilePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route element={<RoleGuard allowedRoles={['customer']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/customer/tracking" element={<CustomerTrackingPage />} />
              <Route path="/customer/tracking/:trackingId" element={<CustomerTrackingPage />} />
            </Route>

            <Route element={<RoleGuard allowedRoles={['driver']} />}>
              <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
              <Route path="/driver/delivery" element={<DriverDeliveryPage />} />
              <Route path="/driver/delivery/:id" element={<DriverDeliveryPage />} />
              <Route path="/driver/deliveries/:id" element={<DriverDeliveryPage />} />
            </Route>

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppRoutes />
            <ToastContainer />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
