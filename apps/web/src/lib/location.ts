export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface GeocodedAddress {
  formattedAddress: string;
  city?: string;
  suburb?: string;
  road?: string;
  postcode?: string;
  coords: GeoCoordinates;
}

/**
 * Calculates the Haversine distance between two sets of coordinates in kilometers.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Gets high-accuracy GPS coordinates from the browser's Geolocation API.
 */
export function getCurrentDeviceLocation(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  });
}

/**
 * Reverse geocodes latitude & longitude into a human-readable street address using OpenStreetMap Nominatim API.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'TOrdTownDeliveryApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding HTTP request failed');
    }

    const data = await response.json();
    const addr = data.address || {};

    const primaryName = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.building;
    const city = addr.city || addr.town || addr.village || addr.county || addr.state_district;
    const postcode = addr.postcode;

    let formatted = primaryName ? `${primaryName}, ${city || ''}` : data.display_name?.split(',').slice(0, 3).join(',') || 'Current GPS Location';
    if (postcode) formatted += ` (${postcode})`;

    return {
      formattedAddress: formatted.trim(),
      city,
      suburb: addr.suburb || addr.neighbourhood,
      road: addr.road,
      postcode,
      coords: { lat, lng },
    };
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return {
      formattedAddress: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      coords: { lat, lng },
    };
  }
}

export interface LocalMarketHub {
  id: string;
  name: string;
  description: string;
  coords: GeoCoordinates;
  isPopular?: boolean;
}

export const PRESET_MARKET_HUBS: LocalMarketHub[] = [
  {
    id: 'town-center',
    name: 'Town Center, Sector 4 Market',
    description: 'Main municipal market complex & organic produce hub',
    coords: { lat: 21.1700, lng: 72.8300 },
    isPopular: true,
  },
  {
    id: 'station-road',
    name: 'Station Road Bazaar, Sector 2',
    description: 'Wholesale fresh vegetable market & daily pantry hub',
    coords: { lat: 21.1650, lng: 72.8250 },
    isPopular: true,
  },
  {
    id: 'health-hub',
    name: 'Health Hub Medical Plaza',
    description: 'Central pharmacy district & hospital care market',
    coords: { lat: 21.1680, lng: 72.8280 },
    isPopular: true,
  },
  {
    id: 'sector-4-plaza',
    name: 'Daily Pantry Sector 4 Commercial Market',
    description: 'Local neighborhood supermarket & quick delivery hub',
    coords: { lat: 21.1710, lng: 72.8320 },
    isPopular: true,
  },
  {
    id: 'green-park',
    name: 'Green Park Colony Gate 1 Hub',
    description: 'Residential fresh farm market & dairy depot',
    coords: { lat: 21.1750, lng: 72.8350 },
    isPopular: false,
  },
  {
    id: 'it-park-ring-road',
    name: 'IT Park Ring Road Plaza',
    description: 'Express office & retail market complex',
    coords: { lat: 21.1820, lng: 72.8410 },
    isPopular: false,
  },
];

/**
 * Searches real-world locations via OpenStreetMap Nominatim API for address autocomplete.
 */
export async function searchAddressNominatim(query: string): Promise<GeocodedAddress[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'TOrdTownDeliveryApp/1.0',
      },
    });

    if (!response.ok) return [];

    const results = await response.json();
    return results.map((item: Record<string, any>) => {
      const addr = item.address || {};
      const primaryName = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.building;
      const city = addr.city || addr.town || addr.village || addr.county;
      
      const formatted = primaryName ? `${primaryName}, ${city || ''}` : item.display_name?.split(',').slice(0, 3).join(',') || item.display_name;

      return {
        formattedAddress: formatted.trim(),
        city,
        suburb: addr.suburb,
        road: addr.road,
        postcode: addr.postcode,
        coords: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      };
    });
  } catch (error) {
    console.warn('Address search error:', error);
    return [];
  }
}
