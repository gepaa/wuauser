import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
  specialties?: string[];
  services?: string[];
  min_rating?: number;
  emergency_only?: boolean;
  open_24h_only?: boolean;
  pet_species?: string;
  urgent_care?: boolean;
  search_type?: 'nearby' | 'smart' | 'featured';
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { method, headers } = req;
    
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body: SearchRequest = await req.json();
    console.log('🔍 Edge Function: Map search request', body);

    const {
      latitude,
      longitude,
      radius_km = 10,
      specialties = [],
      services = [],
      min_rating = 0.0,
      emergency_only = false,
      open_24h_only = false,
      pet_species = '',
      urgent_care = false,
      search_type = 'nearby',
      limit = 20
    } = body;

    // Validate required parameters
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (search_type) {
      case 'smart':
        console.log('🧠 Executing smart search...');
        result = await supabaseClient.rpc('smart_search_clinics', {
          user_lat: latitude,
          user_lng: longitude,
          pet_species,
          urgent_care,
          preferred_services: services
        });
        break;

      case 'featured':
        console.log('⭐ Executing featured clinics search...');
        result = await supabaseClient
          .from('veterinary_clinics')
          .select(`
            id,
            clinic_name,
            description,
            phone,
            email,
            website,
            latitude,
            longitude,
            address,
            city,
            state,
            postal_code,
            specialties,
            services,
            schedule,
            is_24hours,
            is_emergency,
            accepts_pets,
            rating,
            total_reviews,
            is_verified,
            is_active
          `)
          .eq('is_active', true)
          .eq('is_verified', true)
          .gte('rating', 4.0)
          .gte('total_reviews', 3)
          .order('rating', { ascending: false })
          .order('total_reviews', { ascending: false })
          .limit(limit);
        break;

      case 'nearby':
      default:
        console.log('📍 Executing nearby search...');
        result = await supabaseClient.rpc('search_nearby_clinics', {
          user_lat: latitude,
          user_lng: longitude,
          search_radius_km: radius_km,
          required_specialties: specialties,
          required_services: services,
          min_rating,
          emergency_only,
          open_24h_only
        });
        break;
    }

    const { data, error } = result;

    if (error) {
      console.error('🚨 Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add distance calculation for featured clinics
    let processedData = data || [];
    
    if (search_type === 'featured' && processedData.length > 0) {
      processedData = processedData.map((clinic: any) => {
        const distance = calculateDistance(
          { latitude, longitude },
          { latitude: clinic.latitude, longitude: clinic.longitude }
        );
        return {
          ...clinic,
          distance_km: Math.round(distance * 100) / 100
        };
      });
    }

    // Add open status based on current time
    processedData = processedData.map((clinic: any) => {
      const isOpen = isClinicOpenNow(clinic.schedule, clinic.is_24hours);
      return {
        ...clinic,
        is_open_now: isOpen
      };
    });

    console.log(`✅ Found ${processedData.length} clinics`);

    return new Response(
      JSON.stringify({
        data: processedData,
        meta: {
          search_type,
          center: { latitude, longitude },
          radius_km,
          total_results: processedData.length,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('🚨 Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * 
    Math.cos(toRadians(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a clinic is currently open
 */
function isClinicOpenNow(schedule: any, is24Hours: boolean = false): boolean {
  if (is24Hours) return true;
  if (!schedule) return false;

  // Get current time in Mexico City timezone
  const now = new Date();
  const mexicoTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  
  const currentDay = mexicoTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = schedule[currentDay];

  if (!daySchedule || daySchedule.closed) return false;

  const currentTime = mexicoTime.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const openTime = daySchedule.open;
  const closeTime = daySchedule.close;

  return currentTime >= openTime && currentTime <= closeTime;
}

console.log('🚀 Map Search Edge Function is running');