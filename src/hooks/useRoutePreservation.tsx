import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to preserve the current route during page refreshes
 * Stores the current path in sessionStorage to maintain navigation state
 */
export const useRoutePreservation = () => {
  const location = useLocation();

  useEffect(() => {
    // Store current path in sessionStorage (survives page refresh)
    if (location.pathname !== '/') {
      sessionStorage.setItem('lastVisitedRoute', location.pathname);
    }
  }, [location.pathname]);

  const getLastVisitedRoute = (): string => {
    return sessionStorage.getItem('lastVisitedRoute') || '/dashboard';
  };

  const clearLastVisitedRoute = () => {
    sessionStorage.removeItem('lastVisitedRoute');
  };

  return {
    getLastVisitedRoute,
    clearLastVisitedRoute
  };
};
