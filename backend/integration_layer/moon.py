"""Exploratory Moon analog screening data and grounded ORBIT responses.

This is a transparent hackathon heuristic, not a trained Moon ML model.
It consumes precomputed candidates generated from the supplied Earth feature
CSV and the supplied LOLA-derived south-polar slope/roughness rasters.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "processed" / "moon"
CANDIDATES_PATH = DATA_DIR / "moon_analog_candidates.json"
METADATA_PATH = DATA_DIR / "moon_reference_stats.json"


def load_candidates() -> list[dict]:
    if not CANDIDATES_PATH.is_file():
        raise FileNotFoundError(f"Moon candidate data is missing: {CANDIDATES_PATH}")
    with CANDIDATES_PATH.open(encoding="utf-8") as stream:
        return json.load(stream)


def load_metadata() -> dict:
    if not METADATA_PATH.is_file():
        raise FileNotFoundError(f"Moon reference metadata is missing: {METADATA_PATH}")
    with METADATA_PATH.open(encoding="utf-8") as stream:
        return json.load(stream)


def _ids(text: str) -> list[str]:
    return list(dict.fromkeys(
        f"MOON-EARTH-{int(value):02d}"
        for value in re.findall(r"MOON[- ]?EARTH[- ]?(\d{1,2})", text, re.I)
    ))


def _find(records: list[dict], candidate_id: str) -> dict | None:
    wanted = candidate_id.upper().replace("_", "-")
    return next((row for row in records if row["discovery_id"] == wanted), None)


def _describe(row: dict, total: int) -> str:
    f = row["terrain_features"]
    return (
        f"{row['discovery_id']} is ranked {row['rank']} in the exploratory Moon screening. "
        f"Its Earth coordinates are {row['latitude']}, {row['longitude']}. "
        f"The displayed heuristic index is {row['similarity_index']} out of 100 "
        f"(not a probability). Its Earth terrain sample has slope {f['slope_deg']} degrees, "
        f"local relief {f['local_relief_m']} m and Earth roughness {f['roughness_m']} m. "
        f"Source tile: {row['source_file']}. This is one of {total} Earth samples screened. "
        "It is an exploratory computational candidate, not a confirmed lunar analog or landing-site assessment."
    )


def answer(message: str, discovery_ids: list[str] | None = None) -> dict:
    records = load_candidates()
    meta = load_metadata()
    ids = list(dict.fromkeys([*_ids(" ".join(discovery_ids or [])), *_ids(message)]))
    chosen = [row for candidate_id in ids if (row := _find(records, candidate_id))]
    text = message.lower()

    if any(word in text for word in ("limit", "caveat", "limitation", "reliable", "perfect", "accurate")):
        limitations = meta.get("limitations", [])
        reply = "The Moon ranking is a quick hackathon screening, with important limitations:\n" + "\n".join(
            f"- {item}" for item in limitations[:6]
        )
    elif any(word in text for word in ("score", "index", "similarity", "method", "calculate", "formula")) and not any(word in text for word in ("why", "ranked high", "explain this")):
        method = meta["method"]
        reply = (
            "The Moon index is a simple heuristic, not a trained model or probability. "
            f"It combines lunar-slope fit ({int(method['weights']['lunar_slope_fit'] * 100)}%) "
            f"with a within-Earth roughness-percentile balance term ({int(method['weights']['earth_roughness_balance'] * 100)}%). "
            f"The supplied lunar slope median is {method['lunar_slope_median_deg']} degrees. "
            "Because the Earth and lunar terrain scales differ, the result is only a first-pass hackathon ranking."
        )
    elif len(chosen) >= 2:
        a, b = chosen[:2]
        fa, fb = a["terrain_features"], b["terrain_features"]
        reply = (
            f"{a['discovery_id']} has an index of {a['similarity_index']}/100 and "
            f"{b['discovery_id']} has {b['similarity_index']}/100. "
            f"Their slopes are {fa['slope_deg']}° and {fb['slope_deg']}°; "
            f"their local relief values are {fa['local_relief_m']} m and {fb['local_relief_m']} m. "
            "These are exploratory ranking values, not proof that either site is geologically equivalent to the Moon."
        )
    elif chosen:
        reply = _describe(chosen[0], len(records))
    else:
        top = records[:5]
        lines = [
            f"- {r['discovery_id']}: {r['latitude']}, {r['longitude']} — index {r['similarity_index']}/100"
            for r in top
        ]
        reply = (
            "The top Earth candidates in the current exploratory Moon-terrain screening are:\n"
            + "\n".join(lines)
            + "\nAsk me about a candidate ID such as MOON-EARTH-01, or ask for the limitations."
        )

    return {"answer": reply, "mode": "fallback", "discovery_ids": [r["discovery_id"] for r in chosen]}
