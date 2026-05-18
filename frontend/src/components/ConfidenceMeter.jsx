export default function ConfidenceMeter({ confidence, probabilities }) {
  const pct = Math.min(100, Math.max(0, confidence));
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';

  const topProbs = probabilities
    ? Object.entries(probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-gray-400">Confidence</span>
        <span className="font-display text-2xl font-bold text-accent-light">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-900">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {topProbs.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {topProbs.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface-900/60 px-3 py-2">
              <div className="flex justify-between text-xs">
                <span className="capitalize text-gray-400">{label.replace(/_/g, ' ')}</span>
                <span className="font-medium">{value}%</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded bg-surface-700">
                <div className="h-full bg-accent/70" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
