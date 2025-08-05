import { useEffect, useRef } from 'react';

/**
 * Custom hook to prevent memory leaks from async operations
 * Returns a ref that tracks if the component is still mounted
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

/**
 * Custom hook for cancellable fetch operations
 * Returns a fetch function that automatically cancels on unmount
 */
export function useCancellableFetch() {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancellableFetch = async (url, options = {}) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      });

      // Clear the controller reference on successful completion
      abortControllerRef.current = null;

      return response;
    } catch (error) {
      // Don't throw AbortError to the component
      if (error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  };

  return cancellableFetch;
}
