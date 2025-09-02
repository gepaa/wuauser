import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import VetNavBar from '../components/vet/VetNavBar';
import { VetHomeTab } from '../components/vet/tabs/VetHomeTab';
import { VetAgendaTab } from '../components/vet/tabs/VetAgendaTab';
import { VetPatientsTab } from '../components/vet/tabs/VetPatientsTab';
import { VetMessagesTab } from '../components/vet/tabs/VetMessagesTab';
import { VetProfileTab } from '../components/vet/tabs/VetProfileTab';

const Tab = createBottomTabNavigator();

export const VetTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <VetNavBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="VetHome" 
        component={VetHomeTab}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="VetAgenda" 
        component={VetAgendaTab}
        options={{
          tabBarLabel: 'Agenda',
        }}
      />
      <Tab.Screen 
        name="VetPatients" 
        component={VetPatientsTab}
        options={{
          tabBarLabel: 'Pacientes',
        }}
      />
      <Tab.Screen 
        name="VetMessages" 
        component={VetMessagesTab}
        options={{
          tabBarLabel: 'Mensajes',
        }}
      />
      <Tab.Screen 
        name="VetProfile" 
        component={VetProfileTab}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default VetTabNavigator;