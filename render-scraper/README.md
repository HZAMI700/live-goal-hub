# Flashscore Scraper for Render

A production-ready Flashscore scraper using Playwright + FastAPI.

## Features

- ✅ Playwright with Chromium for JS rendering
- ✅ Anti-bot measures (realistic UA, viewport, etc.)
- ✅ In-memory caching with TTLs
- ✅ Auto-restart on errors
- ✅ CORS enabled for frontend access
- ✅ Graceful error handling

## Deployment on Render

### Option 1: Using render.yaml (Recommended)

1. Create a new Web Service on Render
2. Connect your GitHub repo containing this code
3. Render will automatically detect `render.yaml`
4. Deploy!

### Option 2: Using Dockerfile

1. Create a new Web Service on Render
2. Select "Docker" as the environment
3. Deploy!

### Option 3: Manual Configuration

1. Create a new Web Service
2. Environment: Python 3
3. Build Command:
   ```
   pip install -r requirements.txt && playwright install chromium && playwright install-deps
   ```
4. Start Command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check + stats |
| `GET /api/live` | Live matches only |
| `GET /api/today` | All today's matches |
| `GET /api/leagues` | Matches grouped by league |
| `GET /api/match/{id}` | Single match details |

## Environment Variables

No environment variables required for basic operation.

## Frontend Integration

Update your frontend to point to the Render URL:

```typescript
const SCRAPER_URL = "https://your-app.onrender.com";

// Fetch live matches
const response = await fetch(`${SCRAPER_URL}/api/live`);
const data = await response.json();
```

## Notes

- Free Render instances sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds
- Scraper refreshes every 15 seconds when active
