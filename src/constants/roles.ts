/**
 * Role definitions for Nova HR RBAC system
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin', 
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'employee'
} as const;

/**
 * Role hierarchy for permission inheritance
 */
export const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPERVISOR]: 2,
  [ROLES.EMPLOYEE]: 1
} as const;

/**
 * Permissions mapping for each role
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: [
    'manage_users',
    'manage_employees',
    'manage_sites',
    'manage_attendance',
    'manage_payroll',
    'manage_incidents',
    'manage_reports',
    'manage_system',
    'manage_branding',
    'view_analytics'
  ],
  [ROLES.ADMIN]: [
    'manage_employees',
    'manage_sites', 
    'manage_attendance',
    'manage_payroll',
    'manage_incidents',
    'manage_reports',
    'view_analytics'
  ],
  [ROLES.SUPERVISOR]: [
    'view_employees',
    'manage_attendance',
    'create_incidents',
    'view_reports'
  ],
  [ROLES.EMPLOYEE]: [
    'view_own_data',
    'clock_in_out',
    'view_own_payroll',
    'create_incidents'
  ]
} as const;

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  if (!userRole || !requiredRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}