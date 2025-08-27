import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { navigationTester } from '../utils/navigationTest';
import { debugLogger } from '../utils/debugLogger';

interface DebugStats {
  totalListeners: number;
  navigationHistory: number;
  totalErrors: number;
  lastNavigation?: string;
}

export const DebugOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<DebugStats>({
    totalListeners: 0,
    navigationHistory: 0,
    totalErrors: 0
  });

  if (!__DEV__) return null;

  useEffect(() => {
    const updateStats = () => {
      const report = navigationTester.getNavigationReport();
      if (report) {
        setStats({
          totalListeners: report.activeListeners,
          navigationHistory: report.recentHistory.length,
          totalErrors: report.totalErrors,
          lastNavigation: report.lastNavigation?.routeName
        });
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDebugPress = () => {
    setIsVisible(!isVisible);
    debugLogger.navigation('Debug overlay toggled', { visible: !isVisible });
  };

  const handleTestNavigation = () => {
    debugLogger.navigation('Manual navigation test triggered');
    navigationTester.testCriticalPaths();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.debugButton}
        onPress={handleDebugPress}
      >
        <Text style={styles.debugButtonText}>🐛</Text>
      </TouchableOpacity>
      
      {isVisible && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Debug Info</Text>
          
          <View style={styles.stat}>
            <Text style={styles.label}>Listeners:</Text>
            <Text style={styles.value}>{stats.totalListeners}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.label}>Nav History:</Text>
            <Text style={styles.value}>{stats.navigationHistory}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.label}>Errors:</Text>
            <Text style={[styles.value, stats.totalErrors > 0 && styles.error]}>
              {stats.totalErrors}
            </Text>
          </View>
          
          {stats.lastNavigation && (
            <View style={styles.stat}>
              <Text style={styles.label}>Last Route:</Text>
              <Text style={styles.value}>{stats.lastNavigation}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestNavigation}
          >
            <Text style={styles.testButtonText}>Test Nav</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 9999,
  },
  debugButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 16,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    minWidth: 180,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: '#CCC',
    fontSize: 11,
    flex: 1,
  },
  value: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  error: {
    color: '#FF5722',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default DebugOverlay;