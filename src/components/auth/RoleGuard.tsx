import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDefaultPath, matchRoutePermission } from '../../utils/constants';
import type { UserRole } from '../../types';

function AuthSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  );
}

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, authLoading } = useAuth();

  if (authLoading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultPath(user.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RoutePermissionGuard() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  const path = window.location.pathname;
  if (!matchRoutePermission(user.role, path)) {
    return <Navigate to={getDefaultPath(user.role)} replace />;
  }

  return <Outlet />;
}
