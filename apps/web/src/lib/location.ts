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
    id: 'dohrighat-main-market',
    name: 'Dohrighat Main Market Hub',
    description: 'Central town marketplace, fresh organic farm produce & daily groceries',
    coords: { lat: 26.0461, lng: 83.5186 },
    isPopular: true,
  },
  {
    id: 'dohrighat-station-road',
    name: 'Station Road Market, Dohrighat',
    description: 'Wholesale fresh vegetable depot, grains & daily pantry hub',
    coords: { lat: 26.0482, lng: 83.5210 },
    isPopular: true,
  },
  {
    id: 'dohrighat-health-plaza',
    name: 'Dohrighat Hospital Care & Pharmacy Plaza',
    description: 'Central pharmacy district, wellness essentials & medical hub',
    coords: { lat: 26.0445, lng: 83.5160 },
    isPopular: true,
  },
  {
    id: 'ghaghra-ghat-depot',
    name: 'Ghaghra River Road Express Hub',
    description: 'Direct farm harvest & dairy dispatch center',
    coords: { lat: 26.0495, lng: 83.5140 },
    isPopular: true,
  },
  {
    id: 'dohrighat-south-colony',
    name: 'Dohrighat South Residential Market',
    description: 'Neighborhood express supermarket & doorstep delivery hub',
    coords: { lat: 26.0420, lng: 83.5230 },
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
