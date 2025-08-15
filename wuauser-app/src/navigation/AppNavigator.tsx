import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
import { TabNavigator } from './TabNavigator';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            },
          }),
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        
        <Stack.Screen 
          name="UserType" 
          component={UserTypeScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
                opacity: current.progress,
              },
            }),
          }}
        />
        
        <Stack.Screen 
          name="RegisterDueno" 
          component={RegisterDuenoScreen}
          options={{ 
            headerShown: true,
            title: 'Registro de Dueño',
            headerStyle: { 
              backgroundColor: '#F4B740',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#2A2A2A',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        
        <Stack.Screen 
          name="RegisterVeterinario" 
          component={RegisterVeterinarioScreen}
          options={{ 
            headerShown: true,
            title: 'Registro Profesional',
            headerStyle: { 
              backgroundColor: '#4ECDC4',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#2A2A2A',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            headerShown: true,
            title: 'Iniciar Sesión',
            headerStyle: {
              backgroundColor: '#FFF8E7',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#2A2A2A',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        
        {/* Main App Screens */}
        <Stack.Screen 
          name="HomeScreen" 
          component={TabNavigator}
          options={{ 
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="VetDashboard" 
          component={VetDashboardScreen}
          options={{ 
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="QRScanner" 
          component={QRScannerScreen}
          options={{ 
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="AddPet" 
          component={AddPetScreen}
          options={{ 
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="PetDetail" 
          component={PetDetailScreen}
          options={{ 
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="VetDetail" 
          component={VetDetailScreen}
          options={{ 
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;