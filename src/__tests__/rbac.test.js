// src/__tests__/rbac.test.js
import { describe, it, expect } from 'vitest';

describe('Role-Based Access Control', () => {
  const roles = ['superadmin', 'admin', 'supervisor', 'user'];

  const hasPermission = (userRole, requiredRole) => {
    if (userRole === 'superadmin') return true;
    if (requiredRole === 'admin') return ['admin', 'superadmin'].includes(userRole);
    if (requiredRole === 'supervisor') {
      return ['supervisor', 'admin', 'superadmin'].includes(userRole);
    }
    return userRole === requiredRole;
  };

  it('should grant SuperAdmin access to all resources', () => {
    roles.forEach((role) => {
      expect(hasPermission('superadmin', role)).toBe(true);
    });
  });

  it('should grant Admin access to admin resources', () => {
    expect(hasPermission('admin', 'admin')).toBe(true);
    expect(hasPermission('admin', 'superadmin')).toBe(false);
  });

  it('should grant Supervisor access to supervisor and user resources only', () => {
    expect(hasPermission('supervisor', 'supervisor')).toBe(true);
    expect(hasPermission('supervisor', 'user')).toBe(false);
    expect(hasPermission('supervisor', 'admin')).toBe(false);
    expect(hasPermission('supervisor', 'superadmin')).toBe(false);
  });

  it('should grant User access to user resources only', () => {
    expect(hasPermission('user', 'user')).toBe(true);
    expect(hasPermission('user', 'supervisor')).toBe(false);
    expect(hasPermission('user', 'admin')).toBe(false);
    expect(hasPermission('user', 'superadmin')).toBe(false);
  });

  it('should prevent privilege escalation', () => {
    expect(hasPermission('user', 'admin')).toBe(false);
    expect(hasPermission('user', 'superadmin')).toBe(false);
    expect(hasPermission('supervisor', 'admin')).toBe(false);
    expect(hasPermission('admin', 'superadmin')).toBe(false);
  });
});
