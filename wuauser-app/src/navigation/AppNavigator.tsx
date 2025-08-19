import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useDeepLinking } from '../hooks/useDeepLinking';
import { SplashScreen } from '../screens/SplashScreen';
import { UserTypeScreen } from '../screens/UserTypeScreen';
import { RegisterDuenoScreen } from '../screens/RegisterDuenoScreen';
import { RegisterVeterinarioScreen } from '../screens/RegisterVeterinarioScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { VetDashboardScreen } from '../screens/VetDashboardScreen';
import { AddPetScreen } from '../screens/AddPetScreen';
import { PetDetailScreen } from '../screens/PetDetailScreen';
import { VetDetailScreen } from '../screens/VetDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { EmailConfirmScreen } from '../screens/EmailConfirmScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <AppContent />
    </NavigationContainer>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  useDeepLinking(); // Configurar manejo de deep links

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      {user ? (
        // Usuario autenticado
        user.profile?.tipo_usuario === 'veterinario' ? (
          <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
        ) : (
          <Stack.Screen name="HomeScreen" component={TabNavigator} />
        )
      ) : (
        // No autenticado
        <>
          <Stack.Screen name="UserType" component={UserTypeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RegisterDueno" component={RegisterDuenoScreen} />
          <Stack.Screen name="RegisterVeterinario" component={RegisterVeterinarioScreen} />
          <Stack.Screen name="EmailConfirm" component={EmailConfirmScreen} />
        </>
      )}
      
      {/* Screens accesibles independientemente del estado de auth */}
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;