import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

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
        console.log('Perfil cargado:', data);
        setProfile(data);
      } else {
        // Si no hay perfil, usar metadata del usuario
        setProfile({
          id: user.id,
          email: user.email,
          nombre_completo: user.user_metadata?.nombre_completo || 
                          user.user_metadata?.full_name || 
                          user.email?.split('@')[0] || 
                          'Usuario',
          telefono: user.user_metadata?.telefono || 'No registrado',
          tipo_usuario: user.user_metadata?.tipo_usuario || 'dueno'
        });
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refreshProfile: loadProfile };
};