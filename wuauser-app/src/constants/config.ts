export const config = {
  app: {
    name: 'Wuauser',
    version: '1.0.0',
    description: 'Conectando veterinarios con dueños de mascotas en México',
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 10000,
  },
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  },
  features: {
    enablePushNotifications: true,
    enableLocationServices: true,
    enableAnalytics: true,
  },
} as const;