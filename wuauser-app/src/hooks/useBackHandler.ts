import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { debugLogger } from '../utils/debugLogger';

/**
 * Modern BackHandler hook compatible with React Native 0.79+
 * Uses the new subscription pattern instead of deprecated removeEventListener
 */
export const useBackHandler = (handler: () => boolean, enabled: boolean = true) => {
  const handlerRef = useRef(handler);
  
  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const backHandler = () => {
      debugLogger.backHandler('Hardware back press detected');
      return handlerRef.current();
    };
    
    debugLogger.listener('BackHandler', 'added', { enabled });
    const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
    
    return () => {
      debugLogger.listener('BackHandler', 'removed');
      subscription.remove(); // Modern pattern - no removeEventListener
    };
  }, [enabled]);
};

/**
 * Simple back handler for basic navigation
 * Returns true to prevent default behavior, false to allow it
 */
export const useSimpleBackHandler = (onBack: () => void, enabled: boolean = true) => {
  useBackHandler(() => {
    onBack();
    return true; // Prevent default behavior
  }, enabled);
};

/**
 * Back handler for modals that should close on hardware back
 */
export const useModalBackHandler = (isVisible: boolean, onClose: () => void) => {
  useBackHandler(() => {
    if (isVisible) {
      debugLogger.backHandler('Modal close requested via hardware back');
      onClose();
      return true; // Prevent default behavior
    }
    return false; // Allow default behavior
  }, isVisible);
};

export default useBackHandler;