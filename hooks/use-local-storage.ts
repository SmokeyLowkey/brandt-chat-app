'use client';

// This hook has been deprecated and is no longer used.
// The functionality has been moved directly into the providers that need persistence.
// This file is kept for reference only and can be safely deleted.

import { useState, useEffect } from 'react';

/**
 * @deprecated Use direct localStorage access in providers instead
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Use regular useState
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // Warning about deprecation
  useEffect(() => {
    console.warn(
      'useLocalStorage hook is deprecated. ' +
      'The functionality has been moved directly into the providers that need persistence.'
    );
  }, []);
  
  return [storedValue, setStoredValue] as const;
}