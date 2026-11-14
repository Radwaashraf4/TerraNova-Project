# TerraNova Frontend

React + Vite + Three.js + GSAP frontend for the TerraNova terrain-analogue exploration project.

## Local development

```bash
npm ci
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

The default `.env.example` sets `VITE_API_URL=http://localhost:8000`. Start the FastAPI backend from `../backend` before loading the ranked candidate data and ORBIT chat.

## Production build

```bash
npm ci
npm run build
npm run preview
```

Set `VITE_API_URL` to the public HTTPS backend URL in the frontend hosting provider's build environment. Never put backend API keys in `VITE_*` variables.

See the repository-root `README.md` for full architecture, API, scientific limitations, deployment, and NASA Space Apps submission notes.
