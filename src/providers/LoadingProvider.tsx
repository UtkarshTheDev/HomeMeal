import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import InlineLoadingIndicator from "@/src/components/InlineLoadingIndicator";
// Define the context type
interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

// Create the context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Define the provider props
interface LoadingProviderProps {
  children: React.ReactNode;
}

// Create the provider component
export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
}) => {
  // State for loading visibility and message
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("Loading...");
  const [loadingQueue, setLoadingQueue] = useState<string[]>([]);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Show loading screen with optional message
  const showLoading = useCallback(
    (newMessage?: string) => {
      if (newMessage) {
        setMessage(newMessage);
      }

      // Cancel any pending hide animations
      setIsAnimatingOut(false);

      // Add to queue if not already visible
      if (!isVisible) {
        setIsVisible(true);
      } else {
        setLoadingQueue((prev) => [...prev, newMessage || "Loading..."]);
      }
    },
    [isVisible]
  );

  // Hide loading screen
  const hideLoading = useCallback(() => {
    if (loadingQueue.length > 0) {
      // Process next item in queue
      const nextMessage = loadingQueue[0];
      setMessage(nextMessage);
      setLoadingQueue((prev) => prev.slice(1));
    } else {
      // No more items in queue, start hiding animation
      setIsAnimatingOut(true);
      setIsVisible(false);

      // Safety timeout to reset animating state if callback doesn't fire
      setTimeout(() => {
        setIsAnimatingOut(false);
      }, 1000);
    }
  }, [loadingQueue]);

  // Add an effect to automatically process the queue when animation completes
  useEffect(() => {
    if (isAnimatingOut) {
      // Set a timer to automatically process the queue after animation completes
      const timer = setTimeout(() => {
        // Process the next item in the queue
        if (loadingQueue.length > 0) {
          const nextMessage = loadingQueue[0];
          setMessage(nextMessage);
          setLoadingQueue((prev) => prev.slice(1));
          setIsVisible(true);
          setIsAnimatingOut(false);
        } else {
          setIsAnimatingOut(false);
        }
      }, 300); // Shorter animation duration for better UX

      return () => clearTimeout(timer);
    }
  }, [isAnimatingOut, loadingQueue]);

  // CRITICAL: Force hide loading screen after a timeout
  // This prevents the app from getting stuck on loading screen
  useEffect(() => {
    if (isVisible) {
      const forceHideTimeout = setTimeout(() => {
        console.log("⚠️ Force hiding loading screen after timeout");
        setIsVisible(false);
        setIsAnimatingOut(false);
        setLoadingQueue([]);
      }, 8000); // Force hide after 8 seconds

      return () => clearTimeout(forceHideTimeout);
    }
  }, [isVisible]);

  // Context value
  const contextValue = {
    showLoading,
    hideLoading,
    isLoading: isVisible || isAnimatingOut,
  };

  // Add a prop to check if app is initializing
  const isAppInitializing = global.isInitializing === true;

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {/* Only show loading indicator if app is not initializing AND we're not showing splash screen */}
      {!isAppInitializing && !global.isSplashShowing && (
        <InlineLoadingIndicator isVisible={isVisible} message={message} />
      )}
    </LoadingContext.Provider>
  );
};

// Custom hook to use the loading context
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export default LoadingProvider;
