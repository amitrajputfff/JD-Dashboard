import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function usePreviousPage() {
  const router = useRouter();
  const previousPageRef = useRef<string | null>(null);

  useEffect(() => {
    // Store the current pathname when the component mounts
    const currentPath = window.location.pathname;
    
    // Get the referrer from document.referrer
    const referrer = document.referrer;
    
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerPath = referrerUrl.pathname;
        
        // Only store if it's a different page and not the same call details page
        if (referrerPath !== currentPath && !referrerPath.includes('/calls/')) {
          previousPageRef.current = referrerPath;
        } else if (referrerPath === '/calls') {
          // If coming from calls page, store it
          previousPageRef.current = referrerPath;
        }
      } catch (error) {
        console.warn('Failed to parse referrer URL:', error);
      }
    }
    
    // Also check sessionStorage for a more reliable previous page tracking
    const storedPreviousPage = sessionStorage.getItem('previousPage');
    if (storedPreviousPage && storedPreviousPage !== currentPath && !storedPreviousPage.includes('/calls/')) {
      previousPageRef.current = storedPreviousPage;
    }
  }, []);

  const goBack = () => {
    // Try to use browser history first
    if (window.history.length > 1) {
      // Check if we can go back to a valid page
      const currentPath = window.location.pathname;
      const referrer = document.referrer;
      
      if (referrer) {
        try {
          const referrerUrl = new URL(referrer);
          const referrerPath = referrerUrl.pathname;
          
          // If referrer is the calls page or a valid page, use router.back()
          if (referrerPath === '/calls' || (!referrerPath.includes('/calls/') && referrerPath !== currentPath)) {
            router.back();
            return;
          }
        } catch (error) {
          console.warn('Failed to parse referrer URL:', error);
        }
      }
    }
    
    // Fallback to stored previous page or calls page
    if (previousPageRef.current) {
      router.push(previousPageRef.current);
    } else {
      // Final fallback to calls page
      router.push('/calls');
    }
  };

  return { goBack, previousPage: previousPageRef.current };
}
