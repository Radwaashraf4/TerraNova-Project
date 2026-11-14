"""Score terrain rows with the saved Mars-similarity model (no fitting happens here).

The saved bundle contains the fitted preprocessor and nearest-neighbour Mars profile.
Runtime scoring uses NumPy arrays so importing the API does not require importing Pandas
or loading its compiled Windows extensions. Pandas remains a build-time dependency for
build_model.py and the source feature-table workflow.
"""
from __future__ import annotations

import json
import warnings
from pathlib import Path


from .model_loader import load_model_artifacts

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BUNDLE_PATH = PROJECT_ROOT / "model" / "model_bundle.joblib"
METADATA_PATH = PROJECT_ROOT / "model" / "model_metadata.json"

# Preserve the exact saved artifact's five-column input order.
# elev_std is a duplicate of roughness in the supplied training/export data.
FEATURES = ["elevation", "slope_deg", "local_relief", "roughness", "elev_std"]
REQUIRED_FEATURES = FEATURES[:4]


def load_metadata(path: str | Path | None = None) -> dict:
    with Path(path or METADATA_PATH).open(encoding="utf-8") as stream:
        return json.load(stream)


def load_bundle(path: str | Path | None = None):
    """Load the saved model + preprocessor (trusted local file only)."""
    return load_model_artifacts(bundle_path=path or BUNDLE_PATH)


def _normalise_rows(rows) -> np.ndarray:
    """Convert dictionaries or a pandas-like DataFrame to the saved feature order.

    NumPy is imported only when an actual score request is made. This allows the
    API's precomputed discoveries and Moon screening endpoints to start even on
    locked-down Windows machines that block NumPy's compiled extensions.
    """
    import numpy as np
    if hasattr(rows, "to_dict") and not isinstance(rows, (list, tuple)):
        try:
            rows = rows.to_dict(orient="records")
        except TypeError as error:
            raise TypeError("rows must be a list of feature objects or a DataFrame") from error

    if not isinstance(rows, (list, tuple)) or not rows:
        raise ValueError("rows must be a non-empty list of feature objects")

    matrix = []
    for index, row in enumerate(rows):
        if not hasattr(row, "get"):
            raise TypeError(f"row {index} must be a feature object")
        missing = [name for name in REQUIRED_FEATURES if name not in row]
        if missing:
            raise ValueError(f"row {index} is missing feature(s): {missing}")

        values = []
        for feature in FEATURES:
            value = row.get(feature)
            if feature == "elev_std" and value is None:
                value = row["roughness"]
            try:
                values.append(float(value))
            except (TypeError, ValueError) as error:
                raise ValueError(f"row {index} feature '{feature}' must be a number") from error
        matrix.append(values)

    table = np.asarray(matrix, dtype=np.float64)
    if not np.isfinite(table).all():
        raise ValueError("feature values must be finite numbers (no NaN or infinity)")
    return table


def score_rows(rows, bundle=None) -> list[dict]:
    """Score rows with elevation, slope_deg, local_relief and roughness.

    elev_std is filled from roughness when omitted, matching the saved model artifact.
    DataFrame input remains supported through a small duck-typed conversion.
    """
    table = _normalise_rows(rows)
    bundle = bundle or load_bundle()

    # The saved sklearn scalers were fitted with feature names. The model's exact
    # feature order is preserved in FEATURES; NumPy input avoids importing Pandas.
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="X does not have valid feature names",
            category=UserWarning,
        )
        transformed = bundle.preprocessor.transform(table)

    distance = bundle.model.kneighbors(transformed)[0][:, 0]
    similarity = 1.0 / (1.0 + distance)
    return [
        {"distance_to_mars_profile": float(d), "similarity_score": float(s)}
        for d, s in zip(distance, similarity)
    ]
