import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

export const useDeepLinking = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link recibido:', url);
      
      // Parsear la URL
      const { hostname, path, queryParams } = Linking.parse(url);
      
      console.log('🔗 Parsed URL:', { hostname, path, queryParams });
      
      // Manejar diferentes tipos de deep links
      if (path === '/confirm-email') {
        // Navegar a la pantalla de confirmación de email
        navigation.navigate('EmailConfirm' as never);
      } else if (path === '/reset-password') {
        // Manejar reset de contraseña
        console.log('🔗 Reset password deep link');
        // navigation.navigate('ResetPassword' as never);
      } else {
        console.log('🔗 Deep link no reconocido:', url);
      }
    };

    // Escuchar URLs mientras la app está abierta
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Manejar URL inicial (cuando la app se abre desde un link)
    handleInitialURL();

    return () => {
      subscription?.remove();
    };
  }, [navigation]);
};