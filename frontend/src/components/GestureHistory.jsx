export default function GestureHistory({ history, onClear, onFormSentence }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Gesture History</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onFormSentence} className="btn-secondary text-xs py-1.5 px-3">
            Build Sentence
          </button>
          <button type="button" onClick={onClear} className="text-xs text-gray-500 hover:text-red-400">
            Clear
          </button>
        </div>
      </div>
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {history.length === 0 && (
          <li className="text-center text-sm text-gray-500 py-4">No gestures recorded yet</li>
        )}
        {history.map((item, i) => (
          <li
            key={`${item.gesture}-${item.ts}-${i}`}
            className="flex items-center justify-between rounded-lg bg-surface-900/60 px-3 py-2 text-sm"
          >
            <span className="capitalize font-medium">{item.gesture?.replace(/_/g, ' ')}</span>
            <span className="text-accent-light">{item.confidence?.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
