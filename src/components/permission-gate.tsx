"use client"

import { ReactNode } from 'react';
import { authUtils } from '@/lib/auth-utils';

interface PermissionGateProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, user needs ANY
  fallback?: ReactNode; // What to render if user doesn't have permission
  adminBypass?: boolean; // If true, system admins can always see the content
}

/**
 * Permission Gate component to conditionally render content based on user permissions
 * 
 * @param children - Content to render if user has permission
 * @param permissions - Array of permission names to check
 * @param roles - Array of role names to check  
 * @param requireAll - If true, user must have ALL permissions/roles. If false (default), user needs ANY
 * @param fallback - Content to render if user doesn't have permission (default: null)
 * @param adminBypass - If true (default), system admins can always see content
 */
export function PermissionGate({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  adminBypass = true
}: PermissionGateProps) {
  // If admin bypass is enabled and user is system admin, always show content
  if (adminBypass && authUtils.isSystemAdmin()) {
    return <>{children}</>;
  }

  let hasPermission = false;

  // Check permissions
  if (permissions.length > 0) {
    if (requireAll) {
      hasPermission = authUtils.hasAllPermissions(permissions);
    } else {
      hasPermission = authUtils.hasAnyPermission(permissions);
    }
  }

  // Check roles (only if permissions check didn't already grant access)
  if (!hasPermission && roles.length > 0) {
    if (requireAll) {
      hasPermission = authUtils.hasAnyRole(roles) && roles.every(role => authUtils.hasRole(role));
    } else {
      hasPermission = authUtils.hasAnyRole(roles);
    }
  }

  // If no permissions or roles specified, always show content
  if (permissions.length === 0 && roles.length === 0) {
    hasPermission = true;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases

/**
 * Show content only to system administrators
 */
export function AdminOnlyGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate permissions={["system.admin"]} fallback={fallback} adminBypass={false}>
      {children}
    </PermissionGate>
  );
}

/**
 * Show content only to organization administrators (includes system admins)
 */
export function OrgAdminGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate roles={["org_admin", "super_admin"]} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Show content only to users with role management permissions
 */
export function RoleManagementGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate 
      permissions={["organization.read", "organization.update", "organization.delete", "user.create", "user.update", "user.delete"]} 
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}
