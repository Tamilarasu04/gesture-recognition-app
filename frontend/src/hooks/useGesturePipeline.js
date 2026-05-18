import { useCallback, useEffect, useRef, useState } from 'react';
import { predictGesture, translateText, generateSpeech, buildSentence } from '../services/api';
import {
  isBrowserSpeechSupported,
  primeBrowserSpeech,
  speakBrowser,
  stopBrowserSpeech,
  SERVER_TTS_LANGS,
} from '../utils/fastSpeech';

const PREDICT_INTERVAL_MS = 100;
const STABLE_FRAMES = 2;
const MIN_CONFIDENCE = 35;

export function useGesturePipeline(selectedLanguage, voiceMode = false) {
  const [prediction, setPrediction] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [committedGesture, setCommittedGesture] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [gestureHistory, setGestureHistory] = useState([]);
  const [sentence, setSentence] = useState('');
  const [error, setError] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const lastPredictRef = useRef(0);
  const stabilizerRef = useRef([]);
  const lastCommittedGestureRef = useRef(null);
  const lastEnglishRef = useRef('');
  const translateRequestId = useRef(0);
  const voiceModeRef = useRef(voiceMode);
  const currentAudioRef = useRef(null);
  const committingRef = useRef(false);
  const predictInFlightRef = useRef(false);
  const lastSpokenGestureRef = useRef(null);
  const selectedLanguageRef = useRef(selectedLanguage);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  const stopSpeech = useCallback(() => {
    stopBrowserSpeech();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    if (!voiceMode) stopSpeech();
  }, [voiceMode, stopSpeech]);

  const speakWithServer = useCallback(async (text, lang) => {
    const res = await generateSpeech(text, lang);
    const audio = new Audio(`data:${res.data.mime_type};base64,${res.data.audio_base64}`);
    currentAudioRef.current = audio;
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        resolve();
      };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  }, []);

  const speakText = useCallback(
    async (text, lang, gestureId = null) => {
      if (!text?.trim() || !voiceModeRef.current) return;

      stopSpeech();
      setIsSpeaking(true);

      try {
        const useServer = SERVER_TTS_LANGS.has(lang);

        if (!useServer && isBrowserSpeechSupported()) {
          try {
            await speakBrowser(text, lang);
            if (gestureId) lastSpokenGestureRef.current = gestureId;
            return;
          } catch (browserErr) {
            console.warn('Browser TTS failed, using server:', browserErr);
          }
        }

        await speakWithServer(text, lang);
        if (gestureId) lastSpokenGestureRef.current = gestureId;
      } catch (err) {
        console.error('Speech error:', err);
        setError((prev) => prev || `Voice failed: ${err.message || 'check backend'}`);
      } finally {
        setIsSpeaking(false);
      }
    },
    [stopSpeech, speakWithServer]
  );

  const primeVoice = useCallback(async () => {
    try {
      await primeBrowserSpeech();
    } catch {
      /* ok */
    }
  }, []);

  const applyTranslation = useCallback(async (englishText, lang, gestureTag) => {
    if (!englishText?.trim()) {
      setTranslatedText('');
      return '';
    }

    const requestId = ++translateRequestId.current;
    lastEnglishRef.current = englishText;

    if (lang === 'en') {
      setTranslatedText(englishText);
      return englishText;
    }

    setIsTranslating(true);
    try {
      const tr = await translateText(englishText, lang, 'en');
      if (requestId !== translateRequestId.current) return '';
      if (gestureTag && gestureTag !== lastCommittedGestureRef.current) return '';

      const translated = tr.data.translated_text;
      setTranslatedText(translated);
      setError(null);
      return translated;
    } catch (err) {
      if (requestId !== translateRequestId.current) return '';
      setError(err.response?.data?.error || err.message || 'Translation failed');
      setTranslatedText('');
      return '';
    } finally {
      if (requestId === translateRequestId.current) setIsTranslating(false);
    }
  }, []);

  useEffect(() => {
    if (!voiceModeRef.current) return;
    if (!lastCommittedGestureRef.current || !lastEnglishRef.current) return;
    if (prediction?.gesture && prediction.gesture !== lastCommittedGestureRef.current) return;

    (async () => {
      const text = await applyTranslation(
        lastEnglishRef.current,
        selectedLanguage,
        lastCommittedGestureRef.current
      );
      if (text && voiceModeRef.current) {
        await speakText(text, selectedLanguage, `lang-${selectedLanguage}`);
      }
    })();
  }, [selectedLanguage, applyTranslation, prediction?.gesture, speakText]);

  const commitGesture = useCallback(
    async (data, now) => {
      lastCommittedGestureRef.current = data.gesture;
      setCommittedGesture(data.gesture);
      stabilizerRef.current = [];
      setHoldProgress(0);

      setGestureHistory((prev) => {
        if (prev[0]?.gesture === data.gesture) return prev;
        return [{ ...data, ts: now }, ...prev].slice(0, 50);
      });

      const spokenText = await applyTranslation(
        data.english_text,
        selectedLanguageRef.current,
        data.gesture
      );

      if (voiceModeRef.current && spokenText) {
        await speakText(spokenText, selectedLanguageRef.current, data.gesture);
      }
    },
    [applyTranslation, speakText]
  );

  const processLandmarks = useCallback(
    async (landmarks) => {
      const now = Date.now();
      if (now - lastPredictRef.current < PREDICT_INTERVAL_MS) return;
      if (predictInFlightRef.current) return;
      lastPredictRef.current = now;
      predictInFlightRef.current = true;

      try {
        const res = await predictGesture(landmarks.map((lm) => [lm.x, lm.y, lm.z]));
        const data = res.data;
        setPrediction(data);

        if (data.gesture !== lastCommittedGestureRef.current) {
          setTranslatedText('');
          translateRequestId.current += 1;
        }

        const lastInBuffer = stabilizerRef.current[stabilizerRef.current.length - 1];
        if (lastInBuffer && lastInBuffer !== data.gesture) {
          stabilizerRef.current = [data.gesture];
        } else {
          stabilizerRef.current.push(data.gesture);
          if (stabilizerRef.current.length > STABLE_FRAMES) stabilizerRef.current.shift();
        }

        setHoldProgress(
          Math.round((Math.min(stabilizerRef.current.length, STABLE_FRAMES) / STABLE_FRAMES) * 100)
        );

        const stable =
          stabilizerRef.current.length >= STABLE_FRAMES &&
          stabilizerRef.current.every((g) => g === data.gesture) &&
          data.confidence >= MIN_CONFIDENCE;

        if (
          stable &&
          data.gesture !== lastCommittedGestureRef.current &&
          !committingRef.current
        ) {
          committingRef.current = true;
          commitGesture(data, now).finally(() => {
            committingRef.current = false;
          });
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        predictInFlightRef.current = false;
      }
    },
    [commitGesture]
  );

  const playSpeech = useCallback(async () => {
    const synced = committedGesture === prediction?.gesture;
    const lang = selectedLanguageRef.current;
    const text =
      lang === 'en'
        ? prediction?.english_text
        : synced
          ? translatedText
          : translatedText || prediction?.english_text;
    if (!text) return null;
    voiceModeRef.current = true;
    await speakText(text, lang, 'manual');
    return true;
  }, [translatedText, prediction, committedGesture, speakText]);

  const formSentence = useCallback(async () => {
    const gestures = gestureHistory.map((g) => g.gesture).reverse();
    const res = await buildSentence(gestures);
    setSentence(res.data.sentence);
    const text = await applyTranslation(res.data.sentence, selectedLanguageRef.current, null);
    if (voiceModeRef.current && text) {
      await speakText(text, selectedLanguageRef.current, 'sentence');
    }
  }, [gestureHistory, applyTranslation, speakText]);

  const clearHistory = useCallback(() => {
    setGestureHistory([]);
    setSentence('');
    setPrediction(null);
    setTranslatedText('');
    setCommittedGesture(null);
    lastEnglishRef.current = '';
    lastCommittedGestureRef.current = null;
    lastSpokenGestureRef.current = null;
    stabilizerRef.current = [];
    translateRequestId.current += 1;
    setHoldProgress(0);
    stopSpeech();
  }, [stopSpeech]);

  const translationSynced = committedGesture && committedGesture === prediction?.gesture;

  return {
    prediction,
    translatedText,
    committedGesture,
    translationSynced,
    isTranslating,
    isSpeaking,
    gestureHistory,
    sentence,
    error,
    holdProgress,
    processLandmarks,
    playSpeech,
    stopSpeech,
    primeVoice,
    formSentence,
    clearHistory,
  };
};
