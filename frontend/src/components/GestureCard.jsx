import ConfidenceMeter from './ConfidenceMeter';

const GESTURE_ICONS = {
  g_ok: '👌',
  g_like: '👍',
  g_dislike: '👎',
  g_stop: '✋',
  g_palm: '✋',
  g_fist: '👋',
  g_call: '🤙',
  g_one: '1️⃣',
  g_two_up: '2️⃣',
  g_three: '3️⃣',
  g_rock: '🤘',
  g_mute: '🤫',
};

const LANG_NAMES = {
  en: 'English',
  ta: 'Tamil',
  hi: 'Hindi',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  fr: 'French',
  es: 'Spanish',
  ar: 'Arabic',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-cn': 'Chinese',
};

export default function GestureCard({
  prediction,
  translatedText,
  isTranslating,
  holdProgress,
  language,
  translationSynced,
}) {
  if (!prediction) {
    return (
      <div className="glass-card flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
        <span className="text-5xl opacity-40">🖐️</span>
        <p className="mt-4 text-gray-400">Show a hand gesture to the camera</p>
      </div>
    );
  }

  const icon = GESTURE_ICONS[prediction?.gesture_key] || '✋';
  const langLabel = LANG_NAMES[language] || language;
  const showTranslation = language && language !== 'en';

  return (
    <div className="glass-card p-6 shadow-glow">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-accent-light">
            Detected Gesture
          </p>
          <h2 className="font-display mt-1 text-3xl font-bold capitalize">
            {prediction?.display_name ||
              prediction?.gesture?.replace(/^G_/, '').replace(/_/g, ' ') ||
              '—'}
          </h2>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>

      <ConfidenceMeter
        confidence={prediction?.confidence ?? 0}
        probabilities={prediction?.probabilities}
      />

      {holdProgress > 0 && holdProgress < 100 && (
        <p className="mt-2 text-center text-xs text-emerald-400">
          Hold still… {holdProgress}%
        </p>
      )}

      <div className="mt-6 space-y-3">
        <div className="rounded-xl bg-surface-900/80 p-4">
          <p className="text-xs text-gray-500">English</p>
          <p className="text-lg font-medium">{prediction?.english_text || '—'}</p>
        </div>

        {showTranslation && (
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
            <p className="text-xs text-accent-light">{langLabel}</p>
            {isTranslating ? (
              <p className="text-sm text-gray-400 animate-pulse">Translating…</p>
            ) : !translationSynced ? (
              <p className="text-sm text-amber-400/90">
                Hold &quot;{prediction?.english_text}&quot; steady (~0.3 sec, confidence above 35%)
              </p>
            ) : (
              <p className="text-lg font-medium">{translatedText || '—'}</p>
            )}
          </div>
        )}
      </div>

      {isTranslating && (
        <p className="mt-3 text-center text-xs text-gray-500 animate-pulse">Translating…</p>
      )}
    </div>
  );
}
