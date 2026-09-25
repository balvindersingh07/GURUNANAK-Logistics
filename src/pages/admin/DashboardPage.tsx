import { useAuth } from '../../context/AuthContext';
import AdminDashboardPage from './AdminDashboardPage';
import DispatcherDashboardPage from './DispatcherDashboardPage';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'dispatcher') {
    return <DispatcherDashboardPage />;
  }

  return <AdminDashboardPage />;
}
