'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface TransparentHeroVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export function TransparentHeroVideo({ src, poster, className = '' }: TransparentHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const animFrameId = useRef<number | null>(null);

  // WebGL context & program cache
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

  // Initialize WebGL or 2D fallback for real-time background removal
  const initRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return false;

    // Try WebGL first for 0% CPU GPU-accelerated luma-keying
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (gl) {
      const vsSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;

      // Fragment shader that removes white/near-white backgrounds with antialiased edge feathering
      const fsSource = `
        precision mediump float;
        uniform sampler2D u_image;
        varying vec2 v_texCoord;
        void main() {
          vec4 color = texture2D(u_image, v_texCoord);
          
          // Measure whiteness: minimum of RGB components
          float minRGB = min(min(color.r, color.g), color.b);
          float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          
          // Smooth alpha transition: pure white (>0.96) is completely transparent,
          // soft shadows (<0.78) are kept with natural blending
          float alpha = 1.0 - smoothstep(0.78, 0.96, minRGB);
          
          // Prevent white edge fringing by toning down near-white edges
          vec3 finalRgb = color.rgb;
          if (minRGB > 0.80) {
            float edgeFade = (minRGB - 0.80) / 0.16;
            finalRgb = mix(finalRgb, finalRgb * 0.7, edgeFade);
          }
          
          gl_FragColor = vec4(finalRgb, color.a * alpha);
        }
      `;

      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return false;

      const program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Full screen quad geometry
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,  1, -1, -1,  1,
          -1,  1,  1, -1,  1,  1,
        ]),
        gl.STATIC_DRAW
      );

      const posLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLocation);
      gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

      // Texture coordinates (flip Y for video orientation)
      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          0, 1,  1, 1,  0, 0,
          0, 0,  1, 1,  1, 0,
        ]),
        gl.STATIC_DRAW
      );

      const texLocation = gl.getAttribLocation(program, 'a_texCoord');
      gl.enableVertexAttribArray(texLocation);
      gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0, 0);

      // Texture
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      glRef.current = gl;
      textureRef.current = texture;
      return true;
    }
    return false;
  }, []);

  // Main rendering animation loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let useWebGL = initRenderer();
    let ctx2d: CanvasRenderingContext2D | null = null;
    if (!useWebGL) {
      ctx2d = canvas.getContext('2d', { willReadFrequently: true });
    }

    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        // Match canvas dimensions to video intrinsic resolution
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 800;
          canvas.height = video.videoHeight || 800;
          if (useWebGL && glRef.current) {
            glRef.current.viewport(0, 0, canvas.width, canvas.height);
          }
        }

        if (useWebGL && glRef.current && textureRef.current) {
          const gl = glRef.current;
          gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        } else if (ctx2d) {
          // 2D Canvas Fallback
          ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
          const l = frame.data.length;
          for (let i = 0; i < l; i += 4) {
            const r = frame.data[i]!;
            const g = frame.data[i + 1]!;
            const b = frame.data[i + 2]!;
            const minRGB = Math.min(r, g, b);
            if (minRGB > 240) {
              frame.data[i + 3] = 0; // Pure white becomes transparent
            } else if (minRGB > 200) {
              frame.data[i + 3] = Math.floor(frame.data[i + 3]! * (1 - (minRGB - 200) / 40));
            }
          }
          ctx2d.putImageData(frame, 0, 0);
        }
      }
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [initRenderer]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 800);
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
      {/* Hidden underlying video stream */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        crossOrigin="anonymous"
        onLoadedData={() => setIsLoaded(true)}
        className="hidden"
      />

      {/* Real-time Chroma/Luma Keyed Canvas for 100% Background-Free Blend */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full max-h-[660px] xl:max-h-[720px] object-contain filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out will-change-transform group-hover:scale-[1.02] ${
          isLoaded ? 'opacity-100' : 'opacity-90'
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
