import { useState, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    // Skip loader for transitions to login and signup
    const authRoutes = ['/signin', '/signup'];
    if (authRoutes.includes(location.pathname)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isLoading;
};

export default usePageLoader;
