import { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getAnalytics } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9ca3af' } },
  },
  scales: {
    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((res) => setData(res.data))
      .catch(() => setData({ total_gestures: 0, by_gesture: [], by_language: [], daily_counts: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const gestureChart = {
    labels: data?.by_gesture?.map((g) => g.gesture) || [],
    datasets: [
      {
        label: 'Gestures',
        data: data?.by_gesture?.map((g) => g.count) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 8,
      },
    ],
  };

  const langChart = {
    labels: data?.by_language?.map((l) => l.language) || [],
    datasets: [
      {
        data: data?.by_language?.map((l) => l.count) || [],
        backgroundColor: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4ade80'],
      },
    ],
  };

  const dailyChart = {
    labels: data?.daily_counts?.map((d) => d.date) || [],
    datasets: [
      {
        label: 'Daily gestures',
        data: data?.daily_counts?.map((d) => d.count) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-accent-light">{data?.total_gestures ?? 0}</p>
          <p className="text-sm text-gray-400">Total Gestures</p>
        </div>
        <div className="glass-card p-5 text-center sm:col-span-2">
          <p className="text-sm text-gray-400">Analytics powered by MongoDB session data</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Gestures Distribution</h3>
          <div className="h-56">
            <Bar data={gestureChart} options={chartOptions} />
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Languages Used</h3>
          <div className="h-56 flex items-center justify-center">
            <Doughnut data={langChart} options={{ ...chartOptions, scales: undefined }} />
          </div>
        </div>
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Daily Activity</h3>
          <div className="h-56">
            <Line data={dailyChart} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
