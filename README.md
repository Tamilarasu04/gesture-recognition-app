# GestureAI — Multilingual Hand Gesture Recognition

Production-ready full-stack application for real-time hand gesture recognition with multilingual translation and text-to-speech. Built for IEEE-style project demonstrations and cloud deployment (Vercel + Render).

## Architecture

```
Browser (React + MediaPipe Hands)
    │  21 landmark coordinates (x,y,z)
    ▼
Flask REST API (RandomForest + scikit-learn)
    │  gesture label + confidence
    ▼
Translation (Google API / deep-translator) + gTTS speech
    │
    ▼
MongoDB (optional JWT auth, history, analytics)
```

## Features

- **Browser-side MediaPipe** — webcam processing stays in the client (no server camera)
- **11 gestures** — OK, Like, Dislike, Stop, Hello, Call Me, One, Two, Three, Rock, Mute
- **13 languages** — English, Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, French, Spanish, Arabic, Japanese, Korean, Chinese
- **gTTS voice output** — play translated text in the browser
- **Gesture history & sentence builder**
- **Analytics dashboard** — Chart.js charts backed by MongoDB
- **JWT authentication** — register/login with persisted history

## Project Structure

```
gesture-recognition-app/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Flask API + ML model
│   ├── app/
│   ├── models/        # gesture_model.pkl (generated)
│   └── scripts/       # train_model.py
└── README.md
```

## Quick Start (Local)

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/train_model.py
cp .env.example .env
python wsgi.py
```

API runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

App runs at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/predict` | Predict gesture from 21 landmarks |
| POST | `/api/predict/sentence` | Build sentence from gesture list |
| POST | `/api/translate` | Translate text |
| GET | `/api/translate/languages` | Supported languages |
| POST | `/api/speech` | Generate gTTS audio (base64) |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login (JWT) |
| GET | `/api/analytics` | Analytics data |
| GET | `/api/history` | User gesture history |

### Predict request body

```json
{
  "landmarks": [[0.1, 0.2, 0.0], ...]
}
```

21 points, each `[x, y, z]` normalized by MediaPipe (0–1).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Flask secret |
| `JWT_SECRET_KEY` | JWT signing key |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGINS` | Comma-separated frontend URLs |
| `GOOGLE_TRANSLATE_API_KEY` | Optional Google Cloud Translate |
| `TRANSLATION_PROVIDER` | `deep_translator` (default) or `google` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `https://your-api.onrender.com/api`) |

## Deploy Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect this repository; set **Root Directory** to `backend`
3. **Build Command:** `pip install -r requirements.txt && python scripts/train_model.py`
4. **Start Command:** `gunicorn wsgi:app --config gunicorn.conf.py`
5. Add environment variables from `.env.example`
6. Use **MongoDB Atlas** for `MONGODB_URI`

## Deploy Frontend (Vercel)

1. Import project on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add `VITE_API_URL` → your Render API URL + `/api`
4. Deploy

## Using Your Trained Model

Copy your joblib files into `backend/models/`:

```bat
backend\scripts\copy_models.bat
```

Or manually copy:

- `gesture_only_model.joblib`
- `gesture_label_encoder.joblib`

from `Desktop\gesture_output\models\`

The API uses **raw MediaPipe landmarks** (`x0,y0,z0…x20,y20,z20`) — the same format as your `gesture_webapp/app.py` and `gesture_dataset.csv`.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, MediaPipe Hands, Axios, Chart.js
- **Backend:** Flask, scikit-learn RandomForest, gTTS, deep-translator, PyMongo, JWT
- **Deploy:** Gunicorn (Render), Vercel (frontend)

## License

MIT — suitable for academic and portfolio use.
