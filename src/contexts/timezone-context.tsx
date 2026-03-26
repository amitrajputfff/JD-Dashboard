'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserTimezone } from '@/lib/utils/timezone';

interface TimezoneContextType {
  userTimezone: string;
  isLoading: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Automatically detect user's timezone on mount
    const detectedTimezone = getUserTimezone();
    setUserTimezone(detectedTimezone);
    setIsLoading(false);
  }, []);

  return (
    <TimezoneContext.Provider
      value={{
        userTimezone,
        isLoading,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
