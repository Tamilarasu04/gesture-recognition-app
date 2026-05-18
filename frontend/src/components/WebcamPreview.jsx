import { useEffect, useRef } from 'react';
import { useMediaPipeHands } from '../hooks/useMediaPipeHands';

export default function WebcamPreview({ onLandmarks, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { isReady, error, start, stop } = useMediaPipeHands(videoRef, canvasRef, onLandmarks);

  useEffect(() => {
    if (isActive) start();
    else stop();
    return () => stop();
  }, [isActive, start, stop]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        {!isReady && isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-4 text-center text-sm">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <span className="text-sm text-gray-400">
          {isReady ? 'Live detection' : 'Camera idle'}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          MediaPipe Hands
        </span>
      </div>
    </div>
  );
}
