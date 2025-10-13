import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
  size?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  interactive?: boolean;
  customStyle?: ViewStyle;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  size,
  onPress,
  onPressIn,
  onPressOut,
  interactive = false,
  customStyle
}) => {
  const cardStyle = [
    styles.card, 
    variant === 'elevated' && styles.elevated, 
    customStyle,
    style
  ];

  if (onPress || interactive) {
    return (
      <TouchableOpacity 
        style={cardStyle}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});