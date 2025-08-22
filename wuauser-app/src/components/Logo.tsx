import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const logoSizes = {
    small: { container: 60, text: 20 },
    medium: { container: 100, text: 32 },
    large: { container: 150, text: 48 },
  };

  const currentSize = logoSizes[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoContainer,
          {
            width: currentSize.container,
            height: currentSize.container,
          },
        ]}
      >
        <Text
          style={[
            styles.logoText,
            {
              fontSize: currentSize.text,
            },
          ]}
        >
          W
        </Text>
      </View>
      {showText && (
        <Text style={styles.brandText}>Wuauser</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
});