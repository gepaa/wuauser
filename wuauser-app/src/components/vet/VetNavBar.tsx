import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../../constants/vetTheme';

interface VetNavBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabConfig {
  name: string;
  icon: string;
  label: string;
}

const tabs: TabConfig[] = [
  { name: 'VetHome', icon: 'home', label: 'Inicio' },
  { name: 'VetAgenda', icon: 'calendar', label: 'Agenda' },
  { name: 'VetPatients', icon: 'paw', label: 'Pacientes' },
  { name: 'VetMessages', icon: 'chatbubbles', label: 'Mensajes' },
  { name: 'VetProfile', icon: 'person', label: 'Perfil' },
];

export const VetNavBar: React.FC<VetNavBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (routeName: string, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navBar}>
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          const route = state.routes[index];
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => handleTabPress(route.name, index)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
            >
              <Animated.View style={[
                styles.tabContent,
                isFocused && styles.tabContentActive
              ]}>
                <Ionicons
                  name={`${tab.icon}${isFocused ? '' : '-outline'}` as any}
                  size={24}
                  color={isFocused ? vetTheme.colors.primary : vetTheme.colors.text.secondary}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? vetTheme.colors.primary : vetTheme.colors.text.secondary }
                ]}>
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: vetTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: vetTheme.colors.border.light,
    ...vetTheme.shadows.lg,
  },
  navBar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: vetTheme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vetTheme.spacing.xs,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vetTheme.spacing.xs,
    paddingHorizontal: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
    minWidth: 50,
  },
  tabContentActive: {
    backgroundColor: `${vetTheme.colors.primary}10`,
  },
  tabLabel: {
    fontSize: vetTheme.typography.sizes.xs,
    fontWeight: vetTheme.typography.weights.medium,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default VetNavBar;