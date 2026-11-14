"""Rebuild the exploratory Moon analog screening output.

Optional build-time dependencies: pandas, numpy, rasterio.
This script is not needed to run the API: precomputed JSON and CSV outputs are bundled.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parent
EARTH_FEATURES = ROOT / "data" / "features" / "earth_features.csv"
MOON_DIR = ROOT / "data" / "raw" / "moon"
OUTPUT_DIR = ROOT / "data" / "processed" / "moon"
SLOPE_FILE = MOON_DIR / "LDRM_80S_1000MPP_ADJ_SLP_400M.tiff"
ROUGHNESS_FILE = MOON_DIR / "LDRM_80S_1000MPP_ADJ_ROUGH_400M.tiff"


def read_raster(path: Path) -> tuple[np.ndarray, dict]:
    with rasterio.open(path) as src:
        values = src.read(1, masked=True).compressed().astype(float)
        return values, {
            "width": src.width,
            "height": src.height,
            "crs": str(src.crs),
            "pixel_size_m": 1000,
            "valid_pixels": int(values.size),
            "min": float(values.min()),
            "p05": float(np.percentile(values, 5)),
            "p25": float(np.percentile(values, 25)),
            "median": float(np.median(values)),
            "mean": float(values.mean()),
            "p75": float(np.percentile(values, 75)),
            "p95": float(np.percentile(values, 95)),
            "max": float(values.max()),
        }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    earth = pd.read_csv(EARTH_FEATURES)
    required = {"lat", "lon", "elevation", "slope_deg", "local_relief", "roughness", "source"}
    missing = required - set(earth.columns)
    if missing:
        raise ValueError(f"Earth feature file is missing columns: {sorted(missing)}")

    lunar_slope, slope_meta = read_raster(SLOPE_FILE)
    lunar_roughness, roughness_meta = read_raster(ROUGHNESS_FILE)
    slope_median = float(np.median(lunar_slope))
    slope_std = float(np.std(lunar_slope)) or 1.0

    earth["earth_roughness_percentile"] = earth["roughness"].rank(method="average", pct=True).to_numpy()
    earth_roughness_percentile = earth["earth_roughness_percentile"].to_numpy()
    slope_fit = np.exp(-0.5 * ((earth["slope_deg"].to_numpy(float) - slope_median) / slope_std) ** 2) * 100
    roughness_balance = (1 - np.abs(earth_roughness_percentile - 0.5) / 0.5) * 100
    earth["slope_fit_score"] = slope_fit
    earth["earth_roughness_balance_score"] = roughness_balance
    earth["moon_similarity_index"] = 0.8 * slope_fit + 0.2 * roughness_balance
    ranked = earth.sort_values("moon_similarity_index", ascending=False).reset_index(drop=True)

    records = []
    for idx, row in ranked.iterrows():
        records.append({
            "discovery_id": f"MOON-EARTH-{idx + 1:02d}",
            "rank": idx + 1,
            "latitude": round(float(row.lat), 6),
            "longitude": round(float(row.lon), 6),
            "similarity_score": round(float(row.moon_similarity_index) / 100, 6),
            "similarity_index": round(float(row.moon_similarity_index), 3),
            "slope_fit_score": round(float(row.slope_fit_score), 3),
            "earth_roughness_balance_score": round(float(row.earth_roughness_balance_score), 3),
            "earth_roughness_percentile": round(float(row.earth_roughness_percentile * 100), 2),
            "source_file": str(row.source),
            "terrain_features": {
                "elevation_m": round(float(row.elevation), 2),
                "slope_deg": round(float(row.slope_deg), 4),
                "local_relief_m": round(float(row.local_relief), 2),
                "roughness_m": round(float(row.roughness), 4),
            },
            "disclaimer": "Exploratory computational Moon-terrain analog candidate; not a confirmed geological analog or landing-site assessment.",
        })

    metadata = {
        "title": "TerraNova exploratory Moon analog screening",
        "reference_region": "Lunar south-polar region represented by the supplied LOLA-derived 608 x 608 raster products",
        "reference_sources": [SLOPE_FILE.name, ROUGHNESS_FILE.name],
        "lunar_slope": slope_meta,
        "lunar_roughness": roughness_meta,
        "earth_sample_count": int(len(earth)),
        "earth_tiles": sorted(earth["source"].astype(str).unique().tolist()),
        "method": {
            "type": "Exploratory heuristic; not a trained machine-learning model",
            "features_scored": ["slope_deg", "earth_roughness_percentile_balance"],
            "weights": {"lunar_slope_fit": 0.8, "earth_roughness_balance": 0.2},
            "slope_fit": "100 * exp(-0.5 * ((Earth slope - lunar slope median) / lunar slope standard deviation)^2)",
            "roughness_balance": "100 * (1 - abs(Earth roughness percentile - 50) / 50)",
            "combined_index": "0.8 * slope_fit_score + 0.2 * earth_roughness_balance_score",
            "lunar_slope_median_deg": round(slope_median, 6),
            "lunar_slope_std_deg": round(slope_std, 6),
            "score_display": "similarity_index is 0-100; similarity_score is the same index divided by 100 and is not a probability",
        },
        "limitations": [
            "The lunar roughness raster and Earth roughness column are both expressed in metres, but use different definitions and baselines. Lunar roughness is reported as reference context only; it is not numerically compared to Earth roughness.",
            "The roughness component is only a within-Earth-sample percentile-balance heuristic, not a measured Moon-to-Earth roughness match.",
            "Earth feature samples use an analysis scale of about 27.8 km, while the supplied lunar slope and roughness products have 1 km pixel spacing and a 400 m calculation baseline. Scale mismatch can materially change terrain metrics.",
            "No lunar DEM was supplied. Lunar local relief and elevation were not extracted or scored.",
            "The Earth search covers only 6,000 samples from six NASADEM tiles, not global Earth coverage.",
            "Climate, temperature, illumination, permanently shadowed regions, water ice, radiation, geology, mineralogy, resources, and engineering constraints are not analysed.",
            "The index is exploratory, is not a probability, is not a trained Moon ML model, and does not establish a safe or suitable lunar base site.",
        ],
        "disclaimer": "Exploratory computational terrain-similarity candidates for a hackathon demonstration. Not confirmed geological analogs, not a lunar landing-site selection, and not a habitability assessment.",
    }
    (OUTPUT_DIR / "moon_analog_candidates.json").write_text(json.dumps(records, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "moon_reference_stats.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    ranked.to_csv(OUTPUT_DIR / "moon_analog_candidates_all_6000.csv", index=False)
    print(f"Wrote {len(records)} ranked Moon screening candidates to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
