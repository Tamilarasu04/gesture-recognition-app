import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gesture_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const predictGesture = (landmarks) =>
  api.post('/predict', { landmarks }).then((r) => r.data);

export const buildSentence = (gestures) =>
  api.post('/predict/sentence', { gestures }).then((r) => r.data);

export const translateText = (text, targetLanguage, sourceLanguage = 'en') =>
  api
    .post('/translate', {
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage,
    })
    .then((r) => r.data);

export const getLanguages = () => api.get('/translate/languages').then((r) => r.data);

export const generateSpeech = (text, language) =>
  api.post('/speech', { text, language }).then((r) => r.data);

export const getAnalytics = () => api.get('/analytics').then((r) => r.data);

export const getHistory = (limit = 50) =>
  api.get('/history', { params: { limit } }).then((r) => r.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (email, password, name) =>
  api.post('/auth/register', { email, password, name }).then((r) => r.data);

export const healthCheck = () => api.get('/health').then((r) => r.data);

export default api;
