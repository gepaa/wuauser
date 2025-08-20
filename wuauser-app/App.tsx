import React, { useEffect, useState } from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { supabase } from './src/services/supabase';
import * as SecureStore from 'expo-secure-store';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('UserType');

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      if (!supabase) {
        console.log('=== SUPABASE NO CONFIGURADO ===');
        console.log('Modo desarrollo - sin autenticación real');
        console.log('==============================');
        setIsReady(true);
        return;
      }

      // Intentar recuperar sesión guardada
      const savedSession = await SecureStore.getItemAsync('supabase_session');
      
      console.log('=== RESTAURANDO SESIÓN ===');
      console.log('Sesión guardada existe:', !!savedSession);
      
      if (savedSession) {
        const session = JSON.parse(savedSession);
        
        console.log('Intentando restaurar sesión...');
        console.log('Access token existe:', !!session.access_token);
        console.log('Refresh token existe:', !!session.refresh_token);
        
        // Restaurar sesión en Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        
        if (data?.session && !error) {
          console.log('✅ Sesión restaurada exitosamente');
          console.log('Usuario ID:', data.session.user?.id);
          console.log('Usuario email:', data.session.user?.email);
          setInitialRoute('HomeScreen');
        } else {
          console.log('❌ Error restaurando sesión:', error);
          // Limpiar sesión inválida
          await SecureStore.deleteItemAsync('supabase_session');
        }
      } else {
        console.log('No hay sesión guardada - mostrar login');
      }
      console.log('=========================');
    } catch (error) {
      console.error('Error restaurando sesión:', error);
      // Limpiar datos corruptos
      try {
        await SecureStore.deleteItemAsync('supabase_session');
      } catch (cleanError) {
        console.error('Error limpiando sesión:', cleanError);
      }
    } finally {
      setIsReady(true);
    }
  };

  const checkAuth = async () => {
    try {
      if (!supabase) {
        console.log('=== SUPABASE NO CONFIGURADO ===');
        console.log('Modo desarrollo - sin autenticación real');
        console.log('==============================');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log('=== SESIÓN ACTUAL ===');
      console.log('Sesión existe:', !!session);
      console.log('Usuario ID:', session?.user?.id);
      console.log('Usuario email:', session?.user?.email);
      console.log('Tipo usuario:', session?.user?.user_metadata?.tipo_usuario);
      console.log('====================');
      
      if (!session) {
        console.log('NO HAY SESIÓN - Usuario no autenticado');
      }
    } catch (error) {
      console.log('Error verificando autenticación:', error);
    }
  };

  // Mostrar pantalla de carga hasta que la sesión se restaure
  if (!isReady) {
    return null;
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
