const SPEECH_LANG = {
  en: 'en-US',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  fr: 'fr-FR',
  es: 'es-ES',
  ar: 'ar-SA',
  ja: 'ja-JP',
  ko: 'ko-KR',
  'zh-cn': 'zh-CN',
};

/** Indian/regional langs — browser often has no voice; use server gTTS */
export const SERVER_TTS_LANGS = new Set(['ta', 'hi', 'te', 'ml', 'kn', 'bn', 'ar', 'ja', 'ko', 'zh-cn']);

export function isBrowserSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopBrowserSpeech() {
  if (isBrowserSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

function loadVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const onChange = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 400);
  });
}

function pickVoice(voices, lang) {
  const code = SPEECH_LANG[lang] || lang;
  const base = lang.split('-')[0];
  return (
    voices.find((v) => v.lang === code) ||
    voices.find((v) => v.lang.startsWith(base)) ||
    null
  );
}

export async function speakBrowser(text, lang) {
  if (!isBrowserSpeechSupported()) {
    throw new Error('Browser speech not supported');
  }

  const voices = await loadVoices();
  const voice = pickVoice(voices, lang);
  if (!voice) {
    throw new Error(`No browser voice for ${lang}`);
  }

  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 1.05;
    let done = false;

    const finish = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => reject(new Error('Speech timeout')));
    }, 12000);

    utterance.onend = () => finish(resolve);
    utterance.onerror = (e) => finish(() => reject(e.error || new Error('speech error')));

    window.speechSynthesis.speak(utterance);
    // Chrome pause bug — resume synthesis
    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100);
  });
}

/** Call once on user click so Chrome allows autoplay speech */
export async function primeBrowserSpeech() {
  if (!isBrowserSpeechSupported()) return;
  await loadVoices();
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0.01;
  window.speechSynthesis.speak(u);
  window.speechSynthesis.cancel();
}
