# TerraNova — QA / Verification Report

Date: 2026-11-14

## Moon feature implementation

| Check | Result | Evidence |
|---|---|---|
| Earth feature dataset restored | PASS | `earth_features.csv` and `mars_features.csv` are bundled under `backend/data/features/`. |
| Supplied lunar rasters inspected | PASS | Both GeoTIFFs open with Rasterio; each is 608 × 608 with 369,664 valid pixels, 1 km pixel spacing and lunar south-polar stereographic CRS. |
| Moon candidate generation | PASS | `build_moon_candidates.py` generated 6,000 ranked rows and JSON/CSV outputs. |
| Moon API model and discovery routes | PASS | TestClient returned 200 for `/api/moon/model`, `/api/moon/discoveries`, and `/api/moon/discoveries/MOON-EARTH-01`. |
| Moon ORBIT response | PASS | `/api/chat` with `MOON-EARTH-01` context returned a grounded fallback answer from the Moon candidate JSON. |
| Moon comparison route | PASS | `/api/moon/compare` returned a comparison for the first two candidate IDs. |
| Moon service tests | PASS | Four unit tests plus two FastAPI Moon integration tests. |
| Live Uvicorn HTTP smoke test | PASS | Started Uvicorn on `127.0.0.1:8017`; `/api/moon/discoveries?limit=3` returned HTTP 200 with 6,000 evaluated samples; `/api/chat` returned a grounded Moon answer. |
| API resilience when NumPy import is blocked | PASS | Simulated a Windows Application Control NumPy import block: `/api/health`, Mars discoveries, Moon discoveries and Moon ORBIT all returned HTTP 200; `/api/score` returned a clear HTTP 503 instead of preventing API startup. |
| Frontend Moon API data mapping | PASS | Node mapped the API candidate JSON to 20 UI location objects; first ID `MOON-EARTH-01`, index `97.616`. |
| Frontend relative import paths | PASS | 28 relative imports checked; no missing local target files. |
| Frontend JS/JSX syntax | PASS | Babel parser 7.29.14 parsed 19 `.js`/`.jsx` source files with zero syntax errors. |
| Existing integration and FastAPI tests | PASS | 4 integration tests + 3 FastAPI tests + 6 Moon tests = 13 tests passed. |
| Original Mars model and ranking | PRESERVED | The saved model bundle and original Mars ranked CSV were not changed by Moon feature generation. Existing FastAPI model scoring tests passed with a scikit-learn version warning. |

## Top Moon screening results

| Rank | ID | Latitude | Longitude | Index / 100 |
|---:|---|---:|---:|---:|
| 1 | MOON-EARTH-01 | 30.970964 | 50.004029 | 97.616 |
| 2 | MOON-EARTH-02 | 30.245763 | 50.995971 | 96.450 |
| 3 | MOON-EARTH-03 | 10.904279 | -69.995971 | 96.361 |
| 4 | MOON-EARTH-04 | 30.995971 | 50.229091 | 96.007 |
| 5 | MOON-EARTH-05 | -29.104057 | -69.637538 | 94.436 |

These are heuristic results from 6,000 Earth points in six source tiles. They are not validated geological analogs.

## Existing project QA / remaining checks

- Saved Mars model loading and ranking reproduction were previously verified in the test environment, but emitted `InconsistentVersionWarning` because the QA environment has scikit-learn 1.8.0 while the artifact metadata requires 1.9.1. The requirements file pins 1.9.1.
- The user's Windows environment previously reported Windows Application Control blocking NumPy compiled extensions. NumPy and joblib imports are now lazy: the API, precomputed Mars/Moon discoveries and ORBIT fallback can start without NumPy; only live `/api/score`/saved-model inference requires the numerical libraries. If Windows still blocks them, `/api/score` returns HTTP 503 and the device administrator should review the Code Integrity block. The Windows policy itself is not disabled or bypassed.
- Frontend `npm ci` succeeded on the user's Windows machine in the prior session. In this Linux QA container, a clean `npm ci` timed out and `npm run build` could not run because Vite was not installed in the partial `node_modules`. Therefore the new JSX/UI changes still require `npm ci && npm run build` on the user's Windows machine or a clean CI runner.
- Browser/WebGL visual QA was not run in this environment.
- No public deployment was performed; hosting accounts and repository authorization were not provided.
- A full legacy Flask test module could not be imported in this QA container because Flask was not installed in the container runtime. Flask remains declared in `backend/requirements.txt`; the active application uses FastAPI.

## Commands

Backend tests (from `backend/`):

```bash
python -m unittest integration_layer.test_integration test_fastapi test_moon -v
python -m uvicorn main:app --reload --port 8000
```

Frontend (from `TerraNova/`):

```bash
npm ci
npm run build
npm run dev
```
