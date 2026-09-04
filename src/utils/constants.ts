import type { UserRole } from '../types';

/** Route prefixes each role may access (shared notifications/support/profile handled separately) */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    '/dashboard',
    '/deliveries',
    '/tracking',
    '/fleet',
    '/drivers',
    '/customers',
    '/routes',
    '/reports',
    '/settings',
  ],
  dispatcher: ['/dashboard', '/deliveries', '/tracking', '/routes', '/reports'],
  driver: ['/driver/dashboard', '/driver/delivery', '/driver/deliveries'],
  customer: ['/customer/dashboard', '/customer/tracking'],
};

const SHARED_ROUTES = ['/notifications', '/support', '/profile'];

export function canAccessRoute(role: UserRole, path: string): boolean {
  if (SHARED_ROUTES.some((r) => path === r || path.startsWith(r + '/'))) return true;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some((p) => path === p || path.startsWith(p + '/'));
}

export function getDefaultPath(role: UserRole): string {
  if (role === 'customer') return '/customer/dashboard';
  if (role === 'driver') return '/driver/dashboard';
  return '/dashboard';
}

export function matchRoutePermission(role: UserRole, pathname: string): boolean {
  const base = pathname.split('?')[0];
  if (base.startsWith('/login') || base.startsWith('/register') || base.startsWith('/forgot-password') || base.startsWith('/reset-password')) {
    return false;
  }
  if (SHARED_ROUTES.includes(base)) return true;
  if (role === 'customer' && base.startsWith('/deliveries/')) return true;
  return canAccessRoute(role, base);
}

export function isAdminOnlyPath(pathname: string): boolean {
  const base = pathname.split('?')[0];
  return (
    base.startsWith('/fleet') ||
    base.startsWith('/drivers') ||
    base.startsWith('/customers') ||
    base.startsWith('/settings')
  );
}
