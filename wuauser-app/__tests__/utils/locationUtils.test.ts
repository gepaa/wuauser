// Location utility functions tests

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return meters + ' m';
  }
  return distanceKm.toFixed(1) + ' km';
};

describe('LocationUtils', () => {
  const mexicoCityLocation = { latitude: 19.4326, longitude: -99.1332 };
  const guadalajaraLocation = { latitude: 20.6597, longitude: -103.3496 };

  describe('calculateDistance', () => {
    it('debe calcular distancia entre Ciudad de México y Guadalajara', () => {
      const distance = calculateDistance(
        mexicoCityLocation.latitude,
        mexicoCityLocation.longitude,
        guadalajaraLocation.latitude,
        guadalajaraLocation.longitude
      );
      
      expect(distance).toBeCloseTo(460, -1);
    });

    it('debe devolver 0 para el mismo punto', () => {
      const distance = calculateDistance(
        mexicoCityLocation.latitude,
        mexicoCityLocation.longitude,
        mexicoCityLocation.latitude,
        mexicoCityLocation.longitude
      );
      
      expect(distance).toBe(0);
    });
  });

  describe('toRadians', () => {
    it('debe convertir grados a radianes', () => {
      expect(toRadians(0)).toBe(0);
      expect(toRadians(180)).toBeCloseTo(Math.PI);
      expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('formatDistance', () => {
    it('debe formatear distancias correctamente', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(1.5)).toBe('1.5 km');
    });
  });
});
