'use client';

import React, { useEffect, useState } from 'react';
import { useTutorialStore } from '@/lib/stores/tutorial-store';
import { authApi } from '@/lib/api/auth';

interface TutorialProviderProps {
  children: React.ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useTutorialStore();
  const { 
    setFirstTimeUser, 
    showWelcome, 
    skippedTutorials, 
    completedTutorials 
  } = store;

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    // Only run this check once when the app loads, not when isFirstTimeUser changes
    const checkFirstTimeUser = async () => {
      try {
        // Ensure we're in the browser environment and store is ready
        if (typeof window === 'undefined') return;
        if (!setFirstTimeUser || !showWelcome) return;
        
        const user = authApi.getStoredUser();
        if (user) {
          // Check the store's persisted state to see if user has completed or skipped tutorial
          // Only check if they have explicitly skipped or completed tutorials
          const hasExplicitlyDismissed = 
            skippedTutorials.length > 0 || 
            completedTutorials.length > 0;
          
          if (hasExplicitlyDismissed) {
            // User has previously dismissed tutorial, don't show again
            setFirstTimeUser(false);
          } else {
            // User hasn't dismissed tutorial, show welcome if they're still first-time
            const currentFirstTimeStatus = useTutorialStore.getState().isFirstTimeUser;
            if (currentFirstTimeStatus) {
              showWelcome();
            }
          }
        } else {
          // No user found, show welcome if they're still first-time
          const currentFirstTimeStatus = useTutorialStore.getState().isFirstTimeUser;
          if (currentFirstTimeStatus) {
            showWelcome();
          }
        }
      } catch (error) {
        console.error('Error checking first-time user status:', error);
        // On error, don't change the current state
      }
    };

    // Small delay to ensure store is initialized
    const timeoutId = setTimeout(checkFirstTimeUser, 100);
    
    return () => clearTimeout(timeoutId);
  }, [setFirstTimeUser, showWelcome, isHydrated, skippedTutorials.length, completedTutorials.length]);

  return <>{children}</>;
}
