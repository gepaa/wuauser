/**
 * Debug logging system for Wuauser app
 * Provides categorized logging for easier debugging
 */

interface LogData {
  [key: string]: any;
}

export const debugLogger = {
  backHandler: (action: string, data?: LogData) => {
    if (__DEV__) {
      console.log(`[BACKHANDLER] ${action}:`, data);
    }
  },

  navigation: (action: string, data?: LogData) => {
    if (__DEV__) {
      console.log(`[NAVIGATION] ${action}:`, data);
    }
  },

  virtualized: (warning: string, component?: string) => {
    if (__DEV__) {
      console.warn(`[VIRTUALIZED] ${component ? `${component}: ` : ''}${warning}`);
    }
  },

  context: (provider: string, action: string, data?: LogData) => {
    if (__DEV__) {
      console.log(`[CONTEXT] ${provider} - ${action}:`, data);
    }
  },

  error: (category: string, error: Error | string, context?: string) => {
    if (__DEV__) {
      const errorMessage = error instanceof Error ? error.message : error;
      console.error(`[ERROR] ${category}${context ? ` (${context})` : ''}: ${errorMessage}`, error);
    }
  },

  performance: (operation: string, startTime: number, data?: LogData) => {
    if (__DEV__) {
      const duration = Date.now() - startTime;
      console.log(`[PERFORMANCE] ${operation}: ${duration}ms`, data);
    }
  },

  listener: (type: string, action: 'added' | 'removed', data?: LogData) => {
    if (__DEV__) {
      console.log(`[LISTENER] ${type} ${action}:`, data);
    }
  }
};

export default debugLogger;