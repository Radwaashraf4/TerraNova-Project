# TerraNova deployment guide

Recommended hackathon deployment: **Vercel for the React/Vite frontend + Render for the FastAPI backend**. This keeps the static site on a CDN and the Python model/API in a Python service.

## 1. Prepare GitHub

1. Create one public or private repository for the complete `TerraNova_Final` folder.
2. Commit the project source, model artifacts, processed Moon candidate JSON, and required feature files.
3. Do not commit `.env`, API keys, `.venv`, `node_modules`, or build caches.
4. Confirm the repository contains the root `render.yaml`, `backend/`, and `TerraNova/`.

## 2. Deploy the backend on Render

1. Sign in at https://render.com and create **New → Blueprint** (or create a Python Web Service manually).
2. Connect the repository containing the root `render.yaml`. The Blueprint config uses `backend` as `rootDir`.
3. Expected build command: `pip install -r requirements.txt`.
4. Expected start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`.
5. Set `CORS_ORIGINS` to the exact Vercel URL after the frontend is deployed, for example `https://your-project.vercel.app`.
6. Optionally set `ANTHROPIC_API_KEY` on Render only. The built-in grounded fallback works without it.
7. Keep `PYTHON_VERSION=3.14.7` (also pinned in `backend/.python-version`).
8. After deployment, verify `https://YOUR-API.onrender.com/api/health`, `/api/moon/discoveries?limit=5`, `/api/discoveries?limit=5`, and `/docs`.

Render's free web services can spin down after 15 minutes of inactivity, so the first request after idle may be slow. For a live judging demo, use a paid always-on service if the budget allows. Confirm memory during the first deployment; if the saved scikit-learn model or dependencies exceed the selected instance memory, move to a larger instance.

## 3. Deploy the frontend on Vercel

1. Sign in at https://vercel.com and import the same repository.
2. Set **Root Directory** to `TerraNova`.
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`. Install command: `npm ci`. The included `TerraNova/vercel.json` contains these settings.
4. Add build environment variable `VITE_API_URL=https://YOUR-API.onrender.com` (no trailing slash).
5. Deploy. Copy the public Vercel URL.
6. Return to Render and set `CORS_ORIGINS` to that exact Vercel URL, then redeploy the backend.
7. Test the deployed site: Mars discoveries, Moon analog cards, map markers, candidate panels, and ORBIT questions for both Mars and Moon.

## 4. Local production build

From `TerraNova/`:

```bash
npm ci
npm run build
npm run preview
```

From `backend/`:

```bash
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## 5. Important environment variables

| Variable | Where | Required |
|---|---|---|
| `VITE_API_URL` | Vercel build environment | Yes |
| `CORS_ORIGINS` | Render backend | Yes |
| `PYTHON_VERSION` | Render backend | Set to 3.14.7 |
| `ANTHROPIC_API_KEY` | Render backend | Optional |
| `CLAUDE_MODEL` | Render backend | Optional |

Never put `ANTHROPIC_API_KEY` in a `VITE_` variable or frontend `.env` file.

## 6. What is not done automatically

This package includes deployment configuration but has not been deployed because no Git provider authorization or hosting accounts were provided. Do not submit placeholder URLs as live URLs. The actual public API and frontend URLs must be copied from the hosting dashboards after successful deployment and tested by opening them in a private/incognito browser window.
