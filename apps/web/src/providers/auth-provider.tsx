'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGet, setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';

import type { GeoCoordinates } from '@/lib/location';

interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  roles: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  location: string;
  userCoords: GeoCoordinates;
  setLocation: (loc: string, coords?: GeoCoordinates) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_COORDS: GeoCoordinates = { lat: 26.0461, lng: 83.5186 };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocationState] = useState('Dohrighat Town Center (275303)');
  const [userCoords, setUserCoordsState] = useState<GeoCoordinates>(DEFAULT_COORDS);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedLoc = localStorage.getItem('tord_user_location');
      const savedCoordsStr = localStorage.getItem('tord_user_coords');
      if (savedLoc) setLocationState(savedLoc);
      if (savedCoordsStr) {
        try {
          setUserCoordsState(JSON.parse(savedCoordsStr));
        } catch (err) {
          console.warn('Error parsing saved coords:', err);
        }
      }
    }
  }, []);

  const setLocation = (loc: string, coords?: GeoCoordinates) => {
    setLocationState(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tord_user_location', loc);
    }
    if (coords) {
      setUserCoordsState(coords);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tord_user_coords', JSON.stringify(coords));
      }
    }
  };

  const fetchUser = async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }
    setToken(existingToken);
    try {
      const data = await apiGet<UserProfile>('/users/me');
      setUser(data);
    } catch (error) {
      console.warn('Could not fetch user profile:', error);
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: UserProfile) => {
    setAuthToken(accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tord_refresh_token', refreshToken);
    }
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile: fetchUser,
        location,
        userCoords,
        setLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
