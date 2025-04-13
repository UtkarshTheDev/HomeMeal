import React, { useEffect } from 'react';
import { useLoading } from '../providers/LoadingProvider';

interface LoadingInitializerProps {
  message?: string;
}

/**
 * A component that shows the loading screen when mounted
 * and hides it when unmounted
 */
const LoadingInitializer: React.FC<LoadingInitializerProps> = ({ 
  message = "Starting HomeMeal..." 
}) => {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    // Show loading when component mounts
    showLoading(message);

    // Hide loading when component unmounts
    return () => {
      hideLoading();
    };
  }, [message, showLoading, hideLoading]);

  // This component doesn't render anything
  return null;
};

export default LoadingInitializer;
