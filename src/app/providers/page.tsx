'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withProvidersGuard, RouteGuard } from '@/components/route-guard';

function ProvidersPageContent() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to STT providers as the default
    router.replace('/providers/stt');
  }, [router]);

  return (
    <RouteGuard 
      permissions={['system.admin']} 
      requireAll={false}
      adminBypass={true}
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      }
    >
      {null}
    </RouteGuard>
  );
}

// Apply route protection to the page
const ProtectedProvidersPageContent = withProvidersGuard(ProvidersPageContent);

export default function ProvidersPage() {
  return <ProtectedProvidersPageContent />;
}
