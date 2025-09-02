import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment } from '../services/appointmentService';

interface AppointmentStatusBadgeProps {
  status: Appointment['status'];
  size?: 'small' | 'medium' | 'large';
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ 
  status, 
  size = 'medium' 
}) => {
  const getStatusConfig = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          icon: 'time-outline',
        };
      case 'confirmed':
        return {
          label: 'Confirmada',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          icon: 'checkmark-circle-outline',
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          icon: 'close-circle-outline',
        };
      case 'completed':
        return {
          label: 'Completada',
          color: '#2196F3',
          backgroundColor: '#E3F2FD',
          icon: 'checkmark-done-circle-outline',
        };
      default:
        return {
          label: 'Desconocido',
          color: '#666',
          backgroundColor: '#F5F5F5',
          icon: 'help-circle-outline',
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.backgroundColor },
      sizeStyles.container
    ]}>
      <Ionicons 
        name={config.icon as any} 
        size={sizeStyles.iconSize} 
        color={config.color} 
      />
      <Text style={[
        styles.label,
        { color: config.color },
        sizeStyles.text
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        container: { paddingHorizontal: 6, paddingVertical: 2 },
        iconSize: 12,
        text: { fontSize: 11 },
      };
    case 'large':
      return {
        container: { paddingHorizontal: 12, paddingVertical: 6 },
        iconSize: 18,
        text: { fontSize: 14, fontWeight: '600' as const },
      };
    default: // medium
      return {
        container: { paddingHorizontal: 8, paddingVertical: 4 },
        iconSize: 14,
        text: { fontSize: 12, fontWeight: '500' as const },
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AppointmentStatusBadge;