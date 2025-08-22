import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface RadioButtonProps {
  selected: boolean;
  size?: number;
  color?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({ 
  selected, 
  size = 20, 
  color = colors.primary 
}) => {
  return (
    <View style={[
      styles.radioButton, 
      { 
        width: size, 
        height: size, 
        borderColor: selected ? color : '#E0E0E0',
        borderWidth: selected ? size * 0.15 : 2,
      }
    ]}>
      {selected && (
        <View style={[
          styles.radioButtonInner,
          {
            width: size * 0.5,
            height: size * 0.5,
            backgroundColor: color,
          }
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  radioButton: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  radioButtonInner: {
    borderRadius: 50,
  },
});