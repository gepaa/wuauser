import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { vetTheme } from '../../../constants/vetTheme';
import { ViewMode } from '../../../types/agenda';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  showLabels?: boolean;
}

interface ModeConfig {
  mode: ViewMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  shortLabel: string;
}

const modes: ModeConfig[] = [
  {
    mode: 'day',
    label: 'Vista Día',
    icon: 'today-outline',
    shortLabel: 'Día'
  },
  {
    mode: 'week',
    label: 'Vista Semana',
    icon: 'calendar-outline',
    shortLabel: 'Semana'
  },
  {
    mode: 'month',
    label: 'Vista Mes',
    icon: 'grid-outline',
    shortLabel: 'Mes'
  }
];

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentMode,
  onModeChange,
  showLabels = true
}) => {
  
  const handleModeChange = (mode: ViewMode) => {
    if (mode !== currentMode) {
      onModeChange(mode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderModeButton = (config: ModeConfig) => {
    const isActive = config.mode === currentMode;
    
    return (
      <TouchableOpacity
        key={config.mode}
        style={[
          styles.modeButton,
          isActive && styles.modeButtonActive,
          !showLabels && styles.modeButtonCompact
        ]}
        onPress={() => handleModeChange(config.mode)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isActive ? config.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : config.icon}
          size={showLabels ? 20 : 18}
          color={isActive ? vetTheme.colors.text.inverse : vetTheme.colors.text.secondary}
        />
        
        {showLabels && (
          <Text style={[
            styles.modeButtonText,
            isActive && styles.modeButtonTextActive
          ]}>
            {config.shortLabel}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.container,
      !showLabels && styles.containerCompact
    ]}>
      <View style={[
        styles.buttonGroup,
        !showLabels && styles.buttonGroupCompact
      ]}>
        {modes.map(renderModeButton)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: vetTheme.colors.surface,
    marginHorizontal: vetTheme.spacing.md,
    marginVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.lg,
    padding: 4,
    ...vetTheme.shadows.sm,
  },
  containerCompact: {
    marginHorizontal: vetTheme.spacing.sm,
    marginVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.md,
    padding: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  buttonGroupCompact: {
    // No additional styles needed for compact version
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vetTheme.spacing.sm,
    paddingHorizontal: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
    gap: vetTheme.spacing.xs,
  },
  modeButtonCompact: {
    paddingVertical: vetTheme.spacing.xs,
    paddingHorizontal: vetTheme.spacing.xs,
    gap: 0,
  },
  modeButtonActive: {
    backgroundColor: vetTheme.colors.primary,
    ...vetTheme.shadows.sm,
  },
  modeButtonText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.secondary,
  },
  modeButtonTextActive: {
    color: vetTheme.colors.text.inverse,
    fontWeight: vetTheme.typography.weights.semiBold,
  },
});

export default ViewModeSelector;