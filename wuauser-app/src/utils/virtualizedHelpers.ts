import React from 'react';
import { debugLogger } from './debugLogger';

/**
 * Hook to detect and warn about VirtualizedList nesting
 * Use in components that might have nested scrollable content
 */
export const useVirtualizedListDetector = (componentName: string) => {
  React.useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('VirtualizedList')) {
        debugLogger.virtualized(`VirtualizedList warning detected`, componentName);
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, [componentName]);
};

/**
 * Utility to generate safe key extractors
 */
export const createSafeKeyExtractor = (fallbackPrefix: string = 'item') => {
  return (item: any, index: number): string => {
    if (item.id !== undefined) {
      return `${fallbackPrefix}-${item.id}`;
    }
    return `${fallbackPrefix}-${index}`;
  };
};

/**
 * Debugging helper for VirtualizedList issues
 */
export const logVirtualizedListUsage = (componentName: string, listType: string) => {
  debugLogger.virtualized(`${listType} used in ${componentName}`, componentName);
};

export default {
  useVirtualizedListDetector,
  createSafeKeyExtractor,
  logVirtualizedListUsage
};