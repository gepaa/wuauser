import React from 'react';
import { VetTabNavigator } from '../navigation/VetTabNavigator';

interface VetDashboardProps {
  navigation: any;
}

export const VetDashboardScreen: React.FC<VetDashboardProps> = () => {
  return <VetTabNavigator />;
};

export default VetDashboardScreen;