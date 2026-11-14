# TerraNova — NASA Space Apps Cairo 2026

TerraNova is an interactive Earth/Mars/Moon terrain-exploration experience developed for NASA Space Apps Cairo 2026. It addresses the challenge **“Identify Earth Locations that Analog Permanent Moon Base Locations and Mars.”** Its supplied saved machine-learning artifact ranks sampled Earth terrain points by computational similarity to an average Mars terrain profile. The application presents those results as **research candidates**, not confirmed discoveries or scientifically validated analog sites.

## Current architecture

```text
React + Vite + Three.js + GSAP
        |
        | HTTP (VITE_API_URL)
        v
FastAPI (backend/main.py)
        |
        +-- integration_layer/integration.py
        |      `-- ranked candidate CSV / bundled JSON fallback
        |
        +-- integration_layer/scoring.py
        |      `-- saved model/model_bundle.joblib
        |
        `-- integration_layer/chatbot.py
               `-- candidate records + model metadata
                   `-- optional Anthropic Messages API
```

The frontend's Mars results consume the saved-model API. A separate Moon Analog Screening section consumes `/api/moon/discoveries`, displays its own ranked Earth candidates, and adds those coordinates to the Earth marker layer. The Moon results are a transparent hackathon heuristic, not a trained Moon ML model and not a scientific validation claim. The original static reference content in `TerraNova/src/data.js` is retained for planet introduction copy and resources; it is not used as a substitute for either live result set.

## Main features

- Interactive 3D Earth, Mars, and Moon models.
- Candidate markers on the Earth model, generated from the backend's ranked records.
- Ranked candidate cards and coordinate details.
- Saved-model Mars terrain scoring.
- Separate exploratory Moon south-polar terrain screening and ranked Earth candidate list.
- ORBIT chatbot with project-grounded Mars and Moon fallback responses and optional AI-written Mars responses.
- Candidate comparison and scientific limitations.
- Scientific resource links.

## Technology

- Frontend: React 18, Vite, Three.js, GSAP.
- Backend: Python, FastAPI, Pydantic.
- ML: NumPy, Pandas, scikit-learn, joblib.
- Optional chatbot LLM: Anthropic Messages API.

## Project structure

```text
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── build_model.py
│   ├── build_moon_candidates.py        # optional rebuild; requires rasterio
│   ├── export_website_data.py
│   ├── data/
│   │   ├── features/{earth_features,mars_features}.csv
│   │   ├── raw/moon/{...SLP_400M,...ROUGH_400M}.tiff
│   │   └── processed/moon/{moon_analog_candidates.json,moon_reference_stats.json}
│   ├── integration_layer/
│   │   ├── chatbot.py
│   │   ├── integration.py
│   │   ├── model_loader.py
│   │   ├── scoring.py
│   │   ├── moon.py
│   │   ├── api.py                 # legacy Flask compatibility API
│   │   └── data/cleaned_discoveries.json
│   ├── model/
│   │   ├── model_bundle.joblib
│   │   └── model_metadata.json
│   └── outputs/discovery_results/novel_candidates_ranked.csv
└── TerraNova/
    ├── package.json
    ├── .env.example
    ├── public/models/{Earth,Mars,Moon}/
    └── src/
        ├── App.jsx
        ├── apiData.js
        ├── orbitApi.js
        ├── components/MoonDiscoveries.jsx
        ├── engine.js
        ├── useOrbitChat.js
        └── components/
```

## Requirements

- Python 3.14.x recommended for the supplied Windows environment.
- Node.js 20+ (Node 22 LTS recommended).
- npm 10+.
- A compatible WebGL-capable browser.
- For AI-written ORBIT answers only: an Anthropic API key. The chatbot fallback works without it.

The saved `model_bundle.joblib` was created with scikit-learn **1.9.1**. Keep this version pinned when loading the artifact. Do not casually upgrade scikit-learn or rebuild the model.

## Run locally

### 1. Backend — Windows PowerShell

```powershell
cd backend
py -0p
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell script activation is restricted, use CMD:

```cmd
cd backend
py -3.14 -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open:
- API home: http://127.0.0.1:8000/
- Health: http://127.0.0.1:8000/api/health
- Swagger: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

The backend loads `backend/.env` locally through python-dotenv. The `ANTHROPIC_API_KEY` variable is optional. Do not commit `.env` or place API keys in frontend variables. `CORS_ORIGINS` is a comma-separated list of allowed frontend origins.

### 2. Frontend

In a second terminal:

```powershell
cd TerraNova
npm ci
Copy-Item .env.example .env
npm run dev
```

Vite runs at http://localhost:5173. The checked-in local example points `VITE_API_URL` to `http://localhost:8000`.

### 3. Production frontend build

```powershell
cd TerraNova
npm ci
npm run build
npm run preview
```

The production assets are written to `TerraNova/dist/`.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API home |
| GET | `/api/health` | Backend, optional AI-key, and saved-model status |
| GET | `/api/model` | Method, formula, counts, verification, limitations |
| GET | `/api/discoveries?limit=20` | Ranked candidate list and descriptor facts |
| GET | `/api/discoveries/{discovery_id}` | One candidate |
| POST | `/api/chat` | ORBIT question |
| POST | `/api/compare` | Compare two candidate IDs |
| POST | `/api/score` | Score supplied terrain feature rows |

Example chat request:

```json
{
  "message": "Why is MARS-EARTH-01 ranked high?",
  "discovery_ids": ["MARS-EARTH-01"],
  "history": []
}
```

Example compare request:

```json
{
  "id_a": "MARS-EARTH-01",
  "id_b": "MARS-EARTH-02"
}
```

## Moon analog screening — quick hackathon method

The Moon section uses the two supplied NASA LOLA south-polar raster products:

- `LDRM_80S_1000MPP_ADJ_SLP_400M.tiff` — lunar south-polar slope, degrees.
- `LDRM_80S_1000MPP_ADJ_ROUGH_400M.tiff` — lunar south-polar roughness, metres.

Both rasters are 608 × 608 pixels, 1 km pixel spacing, and use a 400 m calculation baseline. The supplied lunar slope raster has 369,664 valid pixels and a median slope of **7.686965°**. The roughness raster is included and its statistics are reported by the API, but it is not numerically compared with Earth roughness because the Earth roughness feature was calculated at a much larger spatial scale and with a different measurement definition.

The screening evaluates all **6,000 Earth feature samples**. It computes a slope-fit component from the lunar slope median and standard deviation, then combines it with a within-Earth roughness-percentile-balance proxy:

```text
slope_fit = 100 * exp(-0.5 * ((Earth slope - lunar slope median) / lunar slope standard deviation)^2)
roughness_balance = 100 * (1 - abs(Earth roughness percentile - 50) / 50)
Moon index = 0.8 * slope_fit + 0.2 * roughness_balance
```

The `similarity_index` is displayed on a 0–100 scale. It is a heuristic index, not a probability, model confidence, or validated similarity score. Earth samples were calculated at about 27.8 km analysis scale; lunar rasters have 1 km pixels and a 400 m baseline. No lunar DEM was supplied, so lunar elevation and local relief are not compared. Climate, illumination, temperature, permanently shadowed regions, water ice, geology, mineralogy, radiation, and engineering suitability are not analysed.

The reproducible candidate output is in `backend/data/processed/moon/`. To rebuild it, install the optional build dependencies (`pandas`, `numpy`, `rasterio`) and run `python build_moon_candidates.py` from `backend/`. Normal API runtime does not require rasterio because it reads the precomputed JSON.

### Lunar source and citation

- **NASA GSFC PGDA — A New View of the Lunar South Pole from LOLA**, including product definitions and file conventions: https://pgda.gsfc.nasa.gov/products/90
- **Barker et al. (2023), Planetary Science Journal 4, 183**, DOI: https://doi.org/10.3847/PSJ/acf3e1
- Data DOI: https://doi.org/10.60903/gsfcpgda-lola-spole

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for the dataset manifest and [`docs/MOON_ANALOG_METHOD.md`](docs/MOON_ANALOG_METHOD.md) for the exact Moon heuristic and top results.

## Primary Mars/Earth data references

The project files identify these primary elevation sources:

- **NASADEM_HGT — NASADEM Merged DEM Global 1 arc second V001** (NASA LP DAAC): https://doi.org/10.5067/MEASURES/NASADEM/NASADEM_HGT.001
- **MOLA MEGDR — Mars Orbiter Laser Altimeter Mission Experiment Gridded Data Record** (NASA Planetary Data System): https://pds-geosciences.wustl.edu/missions/mgs/megdr.html

The candidate CSV records the exact NASADEM tile filename used for each Earth candidate. The MOLA source is the Mars reference used by the model metadata and chatbot descriptions. Verify that the source citations match the exact granules and MOLA map resolution used by the original preprocessing before submitting a scientific methods appendix.

## Model and scientific interpretation

The supplied saved model is a scikit-learn pipeline with a nearest-neighbour representation of the average Mars terrain profile. Runtime scoring uses NumPy arrays and imports NumPy/joblib lazily, only when `/api/score` is called. This allows the API, precomputed Mars/Moon candidate endpoints and ORBIT fallback to start even if a locked-down Windows device blocks NumPy's compiled extensions. In that case, live model scoring returns HTTP 503 with a diagnostic message; no security policy is bypassed. Pandas remains a dependency for the optional model rebuild workflow. Its stored method applies percentile clipping/rescaling, standardisation, Euclidean distance to the average Mars profile, and:

```text
similarity = 1 / (1 + distance)
```

The stored artifact and metadata include five model columns: `elevation`, `slope_deg`, `local_relief`, `roughness`, and `elev_std`. The project metadata and CSV indicate `elev_std` duplicates `roughness`; therefore roughness contributes twice in the stored model. The public descriptor explanation reports four distinct physical descriptors. This duplication is documented as a limitation and has deliberately not been changed in this repair because doing so would change the saved model's methodology and ranking.

The uploaded `data.zip` supplied both source feature tables. They are now included at `backend/data/features/earth_features.csv` and `mars_features.csv`, so the source feature inputs referenced by `build_model.py` are present. Rebuilding the original Mars model is still a separate operation and should only be done deliberately; the supplied saved model and ranking have not been changed.

Other limitations stated by the project:
- Mars: 6,000 sampled Earth points from six NASADEM tiles, not a global Earth search.
- Moon: the 6,000 Earth samples are ranked against the supplied lunar south-polar slope distribution using a transparent heuristic; this is not a trained Moon model or a global Earth search.
- Comparison is against an average Mars profile, not an individual Mars site.
- Rock type, mineralogy, climate, illumination, water/ice and engineering constraints are not part of either screening method.
- Earth and Mars input scales differ.
- The score is not a probability or accuracy estimate.
- Independent geological validation remains pending.

## Deployment preparation

Recommended separation:
- Frontend: **Vercel** static hosting. Set the Vercel project root to `TerraNova`; the included `TerraNova/vercel.json` configures `npm ci`, `npm run build`, and `dist`.
- Backend: **Render** native Python web service. The included root `render.yaml` sets the service root to `backend`, installs `requirements.txt`, and starts Uvicorn. Render supports Python and its docs specify the Uvicorn host/port start command; the free web service can spin down after 15 minutes of inactivity. `backend/.python-version` pins Python 3.14.7.

This split matches the current architecture: Vite emits static assets, while FastAPI hosts the ML artifact and chatbot endpoints. No persistent disk is needed by the current backend because it reads packaged model/data files and does not write user data. Verify RAM usage and cold-start behaviour on the selected Render plan before choosing a tier.

The backend must include the entire `backend/model/` directory and `backend/integration_layer/data/` fallback data. Configure:
- `CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN`
- Optional `ANTHROPIC_API_KEY` on the backend only.
- Optional `CLAUDE_MODEL` on the backend.
- Frontend build variable `VITE_API_URL=https://YOUR-BACKEND-DOMAIN`.

Backend start command:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set the service working directory to `backend`. The model is loaded from the packaged local artifact; no runtime retraining is needed. Confirm the host's RAM and Python 3.14 wheel support before selecting a plan. Do not claim deployment complete until the public `/api/health`, `/api/discoveries`, and `/docs` URLs have been tested.

## QA report

See [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) for executed checks, environment versions, passed tests, and remaining verification items.

## Tests

Run backend tests from `backend/`:

```bash
python -m unittest discover -s . -p "test_*.py" -v
```

Run API checks manually in Swagger at `/docs`, or use the automated FastAPI test suite supplied with this project.

Run frontend build from `TerraNova/`:

```bash
npm ci
npm run build
```

## NASA Space Apps submission checklist

- [ ] Confirm the official 2026 submission portal requirements and deadline.
- [ ] Submit the public project/demo URL requested by the portal.
- [ ] Submit the source repository URL if requested.
- [ ] Provide a concise problem statement and solution description.
- [ ] Describe the challenge connection: Earth terrain analog candidates for Mars/Moon research.
- [ ] List the actual data products, processing, feature definitions, and units.
- [ ] Cite NASADEM, Mars MOLA, and every other source actually used in the analysis, with dataset/product names and landing-page links.
- [ ] Explain the similarity formula and all limitations, including the duplicate roughness feature.
- [ ] Provide a short demonstration video if requested by the portal.
- [ ] Test the public demo in a private/incognito browser and on mobile.
- [ ] Ensure no secrets, local file paths, or localhost API URLs appear in production.
- [ ] Keep a backup of the source repository and deployment configuration.

The official 2026 event page lists the submission window as November 14, 9:00 AM through November 15, 11:59 PM local time. The Global Organizing Team's recent submission clarification says the demo may be a video no longer than 30 seconds or a presentation of up to 7 slides, and that the final-project and demo links must be public. Confirm the exact editable fields in the team's Project tab before final submission.
