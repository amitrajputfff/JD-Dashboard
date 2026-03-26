"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthValidator } from '@/lib/auth-validation';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallback,
  requireAuth = true,
  redirectTo,
}: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthed = AuthValidator.hasBasicAuth();

    if (!requireAuth) {
      // Auth page: redirect to dashboard if already logged in
      if (isAuthed) {
        router.push(redirectTo || '/dashboard');
        return;
      }
      setIsChecking(false);
      return;
    }

    // Protected page: redirect to login if not logged in
    if (!isAuthed) {
      router.push(redirectTo || '/login');
      return;
    }

    setIsChecking(false);
  }, [requireAuth, redirectTo, router]);

  if (isChecking) {
    const isDashboard = pathname?.startsWith('/dashboard');
    return fallback || (
      isDashboard ? (
        <DashboardSkeleton />
      ) : (
        <div className="flex flex-col space-y-3 p-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      )
    );
  }

  if (!requireAuth) {
    return <>{children}</>;
  }

  if (!AuthValidator.hasBasicAuth()) {
    return null;
  }

  return <>{children}</>;
}

export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true,
  redirectTo?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard requireAuth={requireAuth} redirectTo={redirectTo}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

export function AuthPageGuard({
  children,
  fallback,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <AuthGuard requireAuth={false} redirectTo={redirectTo} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}
