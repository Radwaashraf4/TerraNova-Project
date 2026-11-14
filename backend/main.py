import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv(Path(__file__).with_name(".env"), override=False)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from integration_layer import chatbot, scoring, moon


# ==================================================
# APP CONFIGURATION
# ==================================================

app = FastAPI(
    title="TerraNova API",
    description="Terrain similarity analysis and ORBIT chatbot",
    version="1.0.0"
)


# ==================================================
# CORS CONFIGURATION
# ==================================================

def configured_cors_origins() -> list[str]:

    origins = [
        "https://terranova-frontend-5lkcs6dc4-radwaashraf4s-projects.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    raw = os.environ.get("CORS_ORIGINS") or os.environ.get("CORS_ORIGIN")

    if raw:
        origins.extend(
            origin.strip().rstrip("/")
            for origin in raw.split(",")
            if origin.strip()
        )

    return list(dict.fromkeys(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


DISCLAIMER = (
    "Ranked computational terrain-similarity candidates. "
    "Not confirmed discoveries; independent geological review is pending."
)


# ==================================================
# REQUEST MODELS
# ==================================================

class ChatRequest(BaseModel):
    message: str
    discovery_ids: list[str] = Field(default_factory=list)
    history: list[dict] = Field(default_factory=list)


class CompareRequest(BaseModel):
    id_a: str
    id_b: str


class ScoreRequest(BaseModel):
    rows: list[dict]


# ==================================================
# HELPER FUNCTIONS
# ==================================================

def find(records, discovery_id):

    wanted = (
        chatbot.normalise_id(str(discovery_id))
        or str(discovery_id)
    )

    return next(
        (
            i for i, record in enumerate(records)
            if record["discovery_id"] == wanted
        ),
        None
    )


# ==================================================
# ERROR HANDLING
# ==================================================

@app.exception_handler(FileNotFoundError)
async def missing_file_handler(request, error):

    return JSONResponse(
        status_code=503,
        content={"detail": str(error)}
    )


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/")
def home():

    return {
        "status": "success",
        "message": "TerraNova API is running!"
    }


@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "ai_enabled": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "model_saved": scoring.BUNDLE_PATH.is_file(),
        "moon_data_available": (
            moon.CANDIDATES_PATH.is_file()
            and moon.METADATA_PATH.is_file()
        )
    }


# ==================================================
# MODEL INFORMATION
# ==================================================

@app.get("/api/model")
def model_info():

    meta = chatbot.load_metadata()

    return {
        "method": meta["method"],
        "similarity_formula": meta["similarity_formula"],
        "n_earth_points": meta["n_earth_points"],
        "n_mars_points": meta["n_mars_points"],
        "verification": meta["verification"],
        "limitations": chatbot.LIMITATIONS,
        "disclaimer": DISCLAIMER
    }


# ==================================================
# DISCOVERIES
# ==================================================

@app.get("/api/discoveries")
def discoveries(limit: int | None = None):

    records = chatbot.load_records()
    meta = chatbot.load_metadata()

    if limit is None:
        limit = len(records)

    items = [
        {
            **record,
            "descriptor_facts": chatbot.descriptor_facts(record, meta),
            "position_in_ranking": i + 1
        }
        for i, record in enumerate(records[:max(limit, 0)])
    ]

    return {
        "count": len(items),
        "disclaimer": DISCLAIMER,
        "discoveries": items
    }


@app.get("/api/discoveries/{discovery_id}")
def one_discovery(discovery_id: str):

    records = chatbot.load_records()
    meta = chatbot.load_metadata()

    index = find(records, discovery_id)

    if index is None:
        raise HTTPException(
            status_code=404,
            detail=f"{discovery_id} not found"
        )

    return {
        **records[index],
        "descriptor_facts": chatbot.descriptor_facts(records[index], meta),
        "position_in_ranking": index + 1,
        "disclaimer": DISCLAIMER
    }


# ==================================================
# ORBIT CHATBOT
# ==================================================

@app.post("/api/chat")
def chat(body: ChatRequest):

    message = body.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="message is required"
        )

    lunar_context = any(
        str(value).upper().startswith("MOON-EARTH-")
        for value in body.discovery_ids
    )

    lunar_question = any(
        token in message.lower()
        for token in ("moon", "lunar", "moon-earth", "luna")
    )

    if lunar_context or lunar_question:
        return moon.answer(
            message,
            discovery_ids=body.discovery_ids
        )

    return chatbot.answer(
        message,
        history=body.history,
        discovery_ids=body.discovery_ids
    )


# ==================================================
# COMPARE TWO DISCOVERIES
# ==================================================

@app.post("/api/compare")
def compare(body: CompareRequest):

    records = chatbot.load_records()
    meta = chatbot.load_metadata()

    index_a = find(records, body.id_a)
    index_b = find(records, body.id_b)

    if index_a is None or index_b is None:
        raise HTTPException(
            status_code=404,
            detail="id_a and id_b must both be valid discovery ids"
        )

    a = chatbot.record_facts(records, index_a, meta)
    b = chatbot.record_facts(records, index_b, meta)

    comparison = chatbot.compare_facts(a, b)

    reply = chatbot.answer(
        f"Compare {a['id']} and {b['id']}.",
        records=records,
        meta=meta
    )

    return {
        **reply,
        "comparison": comparison
    }


# ==================================================
# TERRAIN SCORING
# ==================================================

@app.post("/api/score")
def score(body: ScoreRequest):

    if not body.rows:
        raise HTTPException(
            status_code=400,
            detail="rows (a list of feature objects) is required"
        )

    try:

        scores = scoring.score_rows(body.rows)

        return {
            "scores": scores,
            "note": (
                "Only comparable if features were computed "
                "exactly like the project's feature tables."
            )
        }

    except (ValueError, KeyError, TypeError) as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except (ImportError, OSError) as error:

        raise HTTPException(
            status_code=503,
            detail=(
                "Numerical scoring dependencies could not be loaded. "
                "Check NumPy/SciPy installation. "
                "The precomputed Mars and Moon discovery endpoints "
                "remain available."
            )
        ) from error


# ==================================================
# MOON ANALOG SCREENING
# ==================================================

@app.get("/api/moon/model")
def moon_model_info():

    meta = moon.load_metadata()

    return {
        "method": meta["method"],
        "reference_region": meta["reference_region"],
        "earth_sample_count": meta["earth_sample_count"],
        "lunar_slope": meta["lunar_slope"],
        "lunar_roughness": meta["lunar_roughness"],
        "limitations": meta["limitations"],
        "disclaimer": meta["disclaimer"],
    }


@app.get("/api/moon/discoveries")
def moon_discoveries(limit: int = 20):

    records = moon.load_candidates()
    meta = moon.load_metadata()

    limit = min(max(limit, 0), 100)

    return {
        "count": min(len(records), limit),
        "total_evaluated": len(records),
        "disclaimer": meta["disclaimer"],
        "method": meta["method"],
        "limitations": meta["limitations"],
        "discoveries": [
            {**row, "total_evaluated": len(records)}
            for row in records[:limit]
        ],
    }


@app.get("/api/moon/discoveries/{discovery_id}")
def one_moon_discovery(discovery_id: str):

    records = moon.load_candidates()
    wanted = discovery_id.upper().replace("_", "-")

    for record in records:

        if record["discovery_id"] == wanted:
            return {
                **record,
                "total_evaluated": len(records),
                "disclaimer": record["disclaimer"]
            }

    raise HTTPException(
        status_code=404,
        detail=f"{discovery_id} not found"
    )


@app.post("/api/moon/compare")
def compare_moon(body: CompareRequest):

    records = moon.load_candidates()

    wanted = {
        body.id_a.upper().replace("_", "-"),
        body.id_b.upper().replace("_", "-")
    }

    chosen = [
        row for row in records
        if row["discovery_id"] in wanted
    ]

    if len(chosen) != 2:
        raise HTTPException(
            status_code=404,
            detail="Both IDs must be valid MOON-EARTH candidates"
        )

    by_id = {
        row["discovery_id"]: row
        for row in chosen
    }

    a = by_id[body.id_a.upper().replace("_", "-")]
    b = by_id[body.id_b.upper().replace("_", "-")]

    return {
        "candidate_a": a,
        "candidate_b": b,
        "similarity_index_difference": round(
            a["similarity_index"] - b["similarity_index"],
            3
        ),
        "note": (
            "Exploratory heuristic comparison only; "
            "not a validated lunar analog assessment."
        )
    }
