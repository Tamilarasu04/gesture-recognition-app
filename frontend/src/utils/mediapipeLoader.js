const SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js',
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.crossOrigin = 'anonymous';
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(el);
  });
}

let loadPromise = null;

export function loadMediaPipe() {
  if (typeof window !== 'undefined' && window.Hands && window.Camera) {
    return Promise.resolve(getMediaPipe());
  }
  if (!loadPromise) {
    loadPromise = SCRIPTS.reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve())
      .then(() => {
        if (!window.Hands || !window.Camera) {
          throw new Error('MediaPipe globals missing after load');
        }
        return getMediaPipe();
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }
  return loadPromise;
}

export function getMediaPipe() {
  return {
    Hands: window.Hands,
    Camera: window.Camera,
    drawConnectors: window.drawConnectors,
    drawLandmarks: window.drawLandmarks,
  };
}
