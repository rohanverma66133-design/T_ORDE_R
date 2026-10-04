'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface TransparentHeroVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export function TransparentHeroVideo({ src, poster = '/images/hero-basket.png', className = '' }: TransparentHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 700);
  };

  // Mute / Unmute toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none group ${className}`}
      onClick={togglePlay}
      title={isPlaying ? 'Click to pause' : 'Click to play'}
    >
      {/* Background radial glow integrated behind the basket */}
      <div className="absolute inset-0 bg-radial from-emerald-500/25 via-[#B4F83C]/10 to-transparent rounded-full blur-3xl transform scale-110 pointer-events-none" />

      {/* Cinematic Seamless Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoaded(true)}
        className={`w-full h-full max-h-[660px] xl:max-h-[720px] object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out will-change-transform group-hover:scale-[1.01] ${
          isLoaded ? 'opacity-100' : 'opacity-95'
        }`}
      />

      {/* Play/Pause Animated Center Feedback Splash */}
      {showFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-300">
          <div className="h-16 w-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            {isPlaying ? (
              <Play className="h-7 w-7 translate-x-0.5 fill-current text-[#B4F83C]" />
            ) : (
              <Pause className="h-7 w-7 fill-current text-white" />
            )}
          </div>
        </div>
      )}

      {/* Minimal Glass Controls at Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all duration-300">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="h-8 w-8 rounded-full bg-[#061B12]/80 backdrop-blur-md border border-emerald-500/30 text-emerald-200 hover:text-[#B4F83C] hover:border-[#B4F83C]/50 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          title={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-0.5 fill-current" />}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="h-8 w-8 rounded-full bg-[#061B12]/80 backdrop-blur-md border border-emerald-500/30 text-emerald-200 hover:text-[#B4F83C] hover:border-[#B4F83C]/50 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
