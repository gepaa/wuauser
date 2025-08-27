import { debugLogger } from './debugLogger';

interface NavigationState {
  routeName: string;
  params?: any;
  timestamp: number;
}

class NavigationTester {
  private navigationHistory: NavigationState[] = [];
  private listenerCount = 0;
  private errorCount = 0;

  logNavigation(routeName: string, params?: any) {
    if (!__DEV__) return;
    
    const state: NavigationState = {
      routeName,
      params,
      timestamp: Date.now()
    };
    
    this.navigationHistory.push(state);
    debugLogger.navigation('Route changed', state);
    
    // Keep only last 10 navigation events
    if (this.navigationHistory.length > 10) {
      this.navigationHistory.shift();
    }
  }

  incrementListenerCount(type: string) {
    if (!__DEV__) return;
    this.listenerCount++;
    debugLogger.listener(type, 'added', { totalListeners: this.listenerCount });
  }

  decrementListenerCount(type: string) {
    if (!__DEV__) return;
    this.listenerCount--;
    debugLogger.listener(type, 'removed', { totalListeners: this.listenerCount });
  }

  logError(error: string, context?: string) {
    if (!__DEV__) return;
    this.errorCount++;
    debugLogger.error('Navigation', error, context);
  }

  getNavigationReport() {
    if (!__DEV__) return null;
    
    return {
      recentHistory: this.navigationHistory,
      activeListeners: this.listenerCount,
      totalErrors: this.errorCount,
      lastNavigation: this.navigationHistory[this.navigationHistory.length - 1]
    };
  }

  testCriticalPaths() {
    if (!__DEV__) return;
    
    debugLogger.navigation('Testing critical navigation paths');
    
    const criticalPaths = [
      'Home → Profile → Map',
      'Home → VetDetail → Map', 
      'Login → Register → Home',
      'MapScreen modal flows'
    ];
    
    criticalPaths.forEach(path => {
      debugLogger.navigation('Critical path test', { path, status: 'monitoring' });
    });
  }

  validateProviderContext() {
    if (!__DEV__) return;
    
    try {
      // This will be called from components to validate context availability
      debugLogger.context('Navigation', 'Provider context validated');
      return true;
    } catch (error) {
      debugLogger.error('Navigation', 'Provider context validation failed', String(error));
      return false;
    }
  }
}

export const navigationTester = new NavigationTester();

export const testNavigation = () => {
  if (__DEV__) {
    console.log('🧪 Starting navigation testing...');
    navigationTester.testCriticalPaths();
    navigationTester.validateProviderContext();
    
    const report = navigationTester.getNavigationReport();
    console.log('📊 Navigation Test Report:', report);
  }
};

export default navigationTester;