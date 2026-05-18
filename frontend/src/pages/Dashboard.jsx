import { useState } from 'react';
import WebcamPreview from '../components/WebcamPreview';
import GestureCard from '../components/GestureCard';
import LanguageSelector from '../components/LanguageSelector';
import GestureHistory from '../components/GestureHistory';
import { useGesturePipeline } from '../hooks/useGesturePipeline';

export default function Dashboard() {
  const [cameraOn, setCameraOn] = useState(false);
  const [language, setLanguage] = useState('ta');
  const [voiceMode, setVoiceMode] = useState(false);

  const {
    prediction,
    translatedText,
    gestureHistory,
    sentence,
    error,
    processLandmarks,
    formSentence,
    holdProgress,
    isTranslating,
    isSpeaking,
    translationSynced,
    primeVoice,
    clearHistory,
  } = useGesturePipeline(language, voiceMode);

  const toggleVoiceMode = async () => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (next) await primeVoice();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Multilingual Hand Gesture Recognition
        </h1>
        <p className="mt-2 max-w-2xl text-gray-400">
          Real-time MediaPipe landmark extraction in your browser, powered by RandomForest ML
          classification and multilingual translation with voice output.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <WebcamPreview onLandmarks={processLandmarks} isActive={cameraOn} />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setCameraOn((v) => !v)}
              className={cameraOn ? 'btn-secondary' : 'btn-primary'}
            >
              {cameraOn ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={
                voiceMode
                  ? 'btn-primary ring-2 ring-emerald-400/60'
                  : 'btn-secondary'
              }
              aria-pressed={voiceMode}
            >
              {voiceMode
                ? isSpeaking
                  ? '🔊 Voice ON — Playing…'
                  : '🔊 Voice ON — Click to turn off'
                : '🔇 Voice OFF — Click to turn on'}
            </button>
          </div>
          {voiceMode && (
            <p className="text-xs text-emerald-400/90">
              Voice mode active: each new gesture will be spoken automatically in the selected language.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <LanguageSelector value={language} onChange={setLanguage} />
          <GestureCard
            prediction={prediction}
            translatedText={translatedText}
            isTranslating={isTranslating}
            holdProgress={holdProgress}
            language={language}
            translationSynced={translationSynced}
          />
          {sentence && (
            <div className="glass-card p-4">
              <p className="text-xs text-gray-500">Formed Sentence</p>
              <p className="text-lg font-medium">{sentence}</p>
            </div>
          )}
          <GestureHistory
            history={gestureHistory}
            onClear={clearHistory}
            onFormSentence={formSentence}
          />
        </div>
      </div>
    </div>
  );
}
