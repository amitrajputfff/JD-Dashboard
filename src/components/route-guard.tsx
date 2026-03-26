"use client"

import { ReactNode, useEffect, useState } from 'react';
import { authUtils } from '@/lib/auth-utils';
import { PermissionDeniedPage } from './permission-denied';
import { Skeleton } from './ui/skeleton';

interface RouteGuardProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, user needs ANY
  adminBypass?: boolean; // If true, system admins can always access
  fallback?: ReactNode; // Custom permission denied component
  loadingFallback?: ReactNode; // Custom loading component
}

/**
 * Route Guard component for protecting entire pages/routes based on permissions
 * 
 * @param children - Page content to render if user has permission
 * @param permissions - Array of permission names to check
 * @param roles - Array of role names to check
 * @param requireAll - If true, user must have ALL permissions/roles. If false (default), user needs ANY
 * @param adminBypass - If true (default), system admins can always access
 * @param fallback - Custom permission denied component
 * @param loadingFallback - Custom loading component while checking permissions
 */
export function RouteGuard({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  adminBypass = true,
  fallback,
  loadingFallback
}: RouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermissions = () => {
      try {
        // If admin bypass is enabled and user is system admin, always grant access
        if (adminBypass && authUtils.isSystemAdmin()) {
          setHasAccess(true);
          setIsLoading(false);
          return;
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

        // If no permissions or roles specified, always grant access
        if (permissions.length === 0 && roles.length === 0) {
          hasPermission = true;
        }

        setHasAccess(hasPermission);
      } catch (error) {
        console.error('Error checking permissions in RouteGuard:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure permissions are loaded
    const timer = setTimeout(checkPermissions, 100);
    
    return () => clearTimeout(timer);
  }, [permissions, roles, requireAll, adminBypass]);

  // Show loading state while checking permissions
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Show permission denied if user doesn't have access
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <PermissionDeniedPage
        requiredPermissions={permissions}
        requiredRoles={roles}
      />
    );
  }

  // Render page content if user has access
  return <>{children}</>;
}

/**
 * Higher Order Component (HOC) for protecting pages with permissions
 * 
 * @param WrappedComponent - The page component to protect
 * @param guardConfig - Route guard configuration
 */
export function withRouteGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardConfig: Omit<RouteGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <RouteGuard {...guardConfig}>
        <WrappedComponent {...props} />
      </RouteGuard>
    );
  };
}

// Convenience HOCs for common protection patterns

/**
 * Protect page for system administrators only
 */
export function withAdminGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRouteGuard(WrappedComponent, {
    permissions: ["system.admin"],
    adminBypass: false
  });
}

/**
 * Protect page for organization administrators (includes system admins)
 */
export function withOrgAdminGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRouteGuard(WrappedComponent, {
    roles: ["org_admin", "super_admin"]
  });
}

/**
 * Protect page for users with role management permissions
 */
export function withRoleManagementGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRouteGuard(WrappedComponent, {
    permissions: ["organization.read", "organization.update", "organization.delete", "system.admin"],
    requireAll: false // User needs ANY of these permissions
  });
}

/**
 * Protect page for users with audit logs permissions
 */
export function withAuditLogsGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRouteGuard(WrappedComponent, {
    permissions: ["system.admin"],
    requireAll: false // User needs ANY of these permissions
  });
}

/**
 * Protect page for users with support center permissions
 */
export function withSupportCenterGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRouteGuard(WrappedComponent, {
    permissions: ["system.admin", "organization.read"],
    requireAll: false // User needs ANY of these permissions
  });
}

/**
 * Protect page for users with provider management permissions
 */
export function withProvidersGuard<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRouteGuard(WrappedComponent, {
    permissions: ["system.admin", "organization.update"],
    requireAll: false // User needs ANY of these permissions
  });
}
