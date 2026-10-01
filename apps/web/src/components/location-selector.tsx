'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@tord/ui';
import {
  MapPin,
  Check,
  Navigation,
  Loader2,
  Search,
  X,
  Compass,
  Store,
  AlertCircle,
  Crosshair,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import {
  getCurrentDeviceLocation,
  reverseGeocode,
  searchAddressNominatim,
  PRESET_MARKET_HUBS,
  calculateDistanceKm,
  type GeocodedAddress,
  type GeoCoordinates,
} from '@/lib/location';

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationSelectorModal({ isOpen, onClose }: LocationSelectorProps) {
  const { location, userCoords, setLocation } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live address search debounce
  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAddressNominatim(searchInput.trim());
        setSearchResults(results);
      } catch (err) {
        console.warn('Address search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchInput]);

  // Real-time GPS location detection
  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsError(null);

    try {
      const coords = await getCurrentDeviceLocation();
      const geocoded = await reverseGeocode(coords.lat, coords.lng);
      setLocation(geocoded.formattedAddress, coords);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.warn('GPS location detection error:', errorObj);
      setGpsError(errorObj.message || 'Failed to detect device location');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSelectAddress = (formattedAddress: string, coords?: GeoCoordinates) => {
    setLocation(formattedAddress, coords);
    setSearchInput('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Delivery Location & Local Market">
      <div className="space-y-5 py-2">
        {/* Active Location Pin Status */}
        <div className="rounded-2xl border border-aurora/30 bg-aurora/10 p-3.5 flex items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-8 w-8 rounded-xl bg-aurora text-dark-text flex items-center justify-center shrink-0 shadow-sm font-black">
              <Crosshair className="h-4 w-4 animate-pulse" />
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-black text-aurora tracking-wider block">
                Active Location Pin
              </span>
              <span className="font-extrabold text-white truncate block">{location}</span>
            </div>
          </div>
          {userCoords && (
            <span className="text-[10px] font-mono font-bold bg-midnight/80 text-aurora px-2.5 py-1 rounded-lg border border-aurora/30 shrink-0">
              {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
            </span>
          )}
        </div>

        {/* 1-Click Live GPS Location Button */}
        <button
          type="button"
          onClick={handleDetectGps}
          disabled={isDetectingGps}
          className="w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-xs font-black text-dark-text bg-aurora hover:bg-aurora-hover rounded-2xl shadow-glow-green transition-all active:scale-[0.99] disabled:opacity-75 cursor-pointer"
        >
          {isDetectingGps ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-dark-text" />
              <span>Detecting Real-Time Device Location...</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 text-dark-text fill-dark-text" />
              <span>Use My Live Device GPS Location</span>
            </>
          )}
        </button>

        {gpsError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{gpsError}. Please choose or search an address below.</span>
          </div>
        )}

        {/* Live Address Autocomplete Search */}
        <div className="space-y-2">
          <label className="text-xs font-black text-soft-text uppercase tracking-wider">
            Search Real Street Address or Landmark
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-soft-text pointer-events-none" />
            <input
              type="text"
              placeholder="Search street name, sector, colony, or city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs font-semibold rounded-2xl border border-white/15 bg-midnight/80 text-white placeholder:text-soft-text/60 focus:outline-none focus:border-aurora focus:ring-1 focus:ring-aurora transition-all backdrop-blur-md"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-2.5 p-0.5 rounded-full text-soft-text hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Search Results Dropdown */}
          {isSearching && (
            <div className="p-4 text-center text-xs text-soft-text flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-aurora" />
              <span>Searching real-world locations via OpenStreetMap...</span>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar rounded-2xl border border-white/15 bg-deep-navy p-2 shadow-2xl backdrop-blur-2xl">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAddress(res.formattedAddress, res.coords)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-aurora shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-white leading-tight">{res.formattedAddress}</p>
                    <p className="text-[10px] text-soft-text mt-0.5">
                      {res.suburb || res.road || res.city ? `${res.road || ''} ${res.suburb || ''} ${res.city || ''}` : 'Real GPS Address'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preset Popular Local Market Hubs */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-soft-text uppercase tracking-wider flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-aurora" />
              <span>Nearest Local Markets & Town Hubs</span>
            </p>
            <span className="text-[10px] font-semibold text-soft-text/70">Calculated from device</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {PRESET_MARKET_HUBS.map((hub) => {
              const isSelected = location === hub.name;
              const dist = userCoords
                ? calculateDistanceKm(userCoords.lat, userCoords.lng, hub.coords.lat, hub.coords.lng)
                : null;

              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => handleSelectAddress(hub.name, hub.coords)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-aurora bg-aurora/15 text-white font-bold shadow-glow-green'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-soft-text hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isSelected ? 'bg-aurora text-dark-text' : 'bg-white/10 text-white'
                      }`}
                    >
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{hub.name}</span>
                        {hub.isPopular && (
                          <span className="text-[9px] font-black uppercase bg-aurora/20 text-aurora border border-aurora/30 px-1.5 py-0.5 rounded-md">
                            Popular Market
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-soft-text/80 block mt-0.5">{hub.description}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {dist !== null && (
                      <span className="text-[10px] font-black text-aurora bg-midnight/80 px-2 py-0.5 rounded-md border border-aurora/30">
                        {dist} km
                      </span>
                    )}
                    {isSelected && <Check className="h-4 w-4 text-aurora shrink-0 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

