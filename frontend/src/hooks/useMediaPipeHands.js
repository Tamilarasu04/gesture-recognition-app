import { useCallback, useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export function useMediaPipeHands(videoRef, canvasRef, onLandmarks) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const onLandmarksRef = useRef(onLandmarks);

  useEffect(() => {
    onLandmarksRef.current = onLandmarks;
  }, [onLandmarks]);

  const stop = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    setIsReady(false);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setError(null);
      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.55,
      });

      hands.onResults((results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks?.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          for (const hand of results.multiHandLandmarks) {
            drawConnectors(ctx, hand, HAND_CONNECTIONS, {
              color: '#6366f1',
              lineWidth: 3,
            });
            drawLandmarks(ctx, hand, {
              color: '#a5b4fc',
              lineWidth: 1,
              radius: 4,
            });
          }

          const normalized = landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          }));
          onLandmarksRef.current?.(normalized);
        }

        ctx.restore();
      });

      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 480,
        height: 360,
      });

      await camera.start();
      cameraRef.current = camera;
      setIsReady(true);
    } catch (err) {
      setError(err.message || 'Failed to start camera');
      stop();
    }
  }, [videoRef, canvasRef, stop]);

  useEffect(() => () => stop(), [stop]);

  return { isReady, error, start, stop };
}
