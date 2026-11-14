TerraNova FastAPI backend

From this directory (Windows CMD):
  py -3.14 -m venv .venv
  .venv\Scripts\activate
  python -m pip install -r requirements.txt
  copy .env.example .env
  python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

Swagger: http://127.0.0.1:8000/docs
Health:  http://127.0.0.1:8000/api/health
Moon candidates: http://127.0.0.1:8000/api/moon/discoveries?limit=20

Tests (FastAPI + integration + Moon screening):
  python -m unittest integration_layer.test_integration test_fastapi test_moon -v

The primary application API is FastAPI in main.py. integration_layer/api.py is a retained
legacy Flask compatibility API and is not used by the React frontend.

The saved Mars model and ranking are preserved. Earth and Mars source feature tables are
bundled under data/features/. The Moon screening is a separate exploratory heuristic built
from 6,000 Earth feature samples and the supplied LOLA south-polar slope/roughness rasters.
It is not a trained Moon model, not a probability, and not a lunar landing-site assessment.

The precomputed Moon JSON is read at runtime. Rebuild only if needed, from this directory:
  python build_moon_candidates.py
The rebuild script additionally requires rasterio. No rasterio dependency is required for
normal FastAPI runtime.
