import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import * as SecureStore from 'expo-secure-store';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();

    // Suscribirse a cambios de auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadProfile();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // First try to get from SecureStore (local data)
      const savedEmail = await SecureStore.getItemAsync('user_email');
      const userType = await SecureStore.getItemAsync('user_type') || 'dueno';
      const savedProfile = await SecureStore.getItemAsync('user_profile');

      if (savedEmail) {
        let localProfile: any;

        if (savedProfile) {
          // Use saved profile data
          const profileData = JSON.parse(savedProfile);
          localProfile = {
            id: profileData.id || 'local_user',
            email: profileData.email || savedEmail,
            nombre_completo: profileData.name || profileData.nombre_completo ||
                           savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            telefono: profileData.phone || profileData.telefono || '+52 55 1234 5678',
            tipo_usuario: profileData.tipo_usuario || userType
          };
        } else {
          // Create profile from email
          const baseName = savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          localProfile = {
            id: 'local_user',
            email: savedEmail,
            nombre_completo: baseName,
            telefono: '+52 55 1234 5678',
            tipo_usuario: userType
          };
        }

        setProfile(localProfile);
        setLoading(false);

        // Try Supabase in background to sync if available
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Try to get profile from Supabase
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (data) {
              console.log('Perfil Supabase cargado:', data);
              setProfile(data);
              // Save to local storage for future offline access
              await SecureStore.setItemAsync('user_profile', JSON.stringify(data));
            }
          }
        } catch (supabaseError) {
          console.log('Supabase not available, using local data');
        }

        return;
      }

      // If no local data, try Supabase only
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Buscar perfil en la tabla
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        console.log('Perfil Supabase cargado:', data);
        setProfile(data);
        // Save to local storage for offline access
        await SecureStore.setItemAsync('user_email', data.email);
        await SecureStore.setItemAsync('user_profile', JSON.stringify(data));
        await SecureStore.setItemAsync('user_type', data.tipo_usuario || 'dueno');
      } else {
        // Si no hay perfil, usar metadata del usuario
        const fallbackProfile = {
          id: user.id,
          email: user.email,
          nombre_completo: user.user_metadata?.nombre_completo ||
                          user.user_metadata?.full_name ||
                          user.email?.split('@')[0] ||
                          'Usuario',
          telefono: user.user_metadata?.telefono || '+52 55 1234 5678',
          tipo_usuario: user.user_metadata?.tipo_usuario || 'dueno'
        };

        setProfile(fallbackProfile);

        // Save fallback data locally
        if (user.email) {
          await SecureStore.setItemAsync('user_email', user.email);
          await SecureStore.setItemAsync('user_profile', JSON.stringify(fallbackProfile));
          await SecureStore.setItemAsync('user_type', fallbackProfile.tipo_usuario);
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);

      // Ultimate fallback - check for any local data
      try {
        const savedEmail = await SecureStore.getItemAsync('user_email');
        if (savedEmail) {
          const baseName = savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          setProfile({
            id: 'local_user',
            email: savedEmail,
            nombre_completo: baseName,
            telefono: '+52 55 1234 5678',
            tipo_usuario: 'dueno'
          });
        }
      } catch (localError) {
        console.error('Error loading local profile:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refreshProfile: loadProfile };
};