import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { UserTypeSelectionScreen } from '../screens/UserTypeSelectionScreen';
import { RegisterDuenoScreen } from '../screens/RegisterDuenoScreen';
import { RegisterVeterinarioScreen } from '../screens/RegisterVeterinarioScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { AuthStackParamList, TipoUsuario } from '../types';

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
  onGuestAccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({
  onAuthSuccess,
  onGuestAccess,
}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="UserTypeSelection"
    >
      <Stack.Screen name="UserTypeSelection">
        {(props) => (
          <UserTypeSelectionScreen
            onSelectUserType={(tipo: TipoUsuario) => {
              if (tipo === 'guest') {
                props.navigation.navigate('QRScanner');
              } else if (tipo === 'dueno') {
                props.navigation.navigate('RegisterDueno');
              } else if (tipo === 'veterinario') {
                props.navigation.navigate('RegisterVeterinario');
              }
            }}
            onNavigateToLogin={() => props.navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onSuccess={onAuthSuccess}
            onNavigateToRegister={() => props.navigation.navigate('UserTypeSelection')}
            onContinueAsGuest={onGuestAccess}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="RegisterDueno">
        {(props) => (
          <RegisterDuenoScreen
            onSuccess={onAuthSuccess}
            onNavigateBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="RegisterVeterinario">
        {(props) => (
          <RegisterVeterinarioScreen
            onSuccess={onAuthSuccess}
            onNavigateBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="QRScanner"
        component={QRScannerScreen}
      />
    </Stack.Navigator>
  );
};