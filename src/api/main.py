"""
FastAPI application entrypoint — CORS, rate limiting, structured logging, JWT middleware.
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import settings
from src.database.connection import create_tables

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level   = logging.INFO if not settings.DEBUG else logging.DEBUG,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("clinical_api")


# ── Lifespan (startup / shutdown) ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.VERSION, settings.ENV)
    create_tables()
    yield
    logger.info("Shutting down")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = settings.APP_NAME,
    version     = settings.VERSION,
    docs_url    = "/docs" if settings.ENV != "production" else None,
    redoc_url   = None,
    lifespan    = lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.ALLOWED_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers     = ["*"],
)


# ── Request logging + timing middleware ──────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    elapsed = round((time.perf_counter() - start) * 1000, 1)
    logger.info("%s %s → %s  [%sms]", request.method, request.url.path, response.status_code, elapsed)
    response.headers["X-Response-Time"] = f"{elapsed}ms"
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
from src.api.routes.auth       import router as auth_router
from src.api.routes.prediction import router as prediction_router
from src.api.routes.analysis   import router as analysis_router
from src.api.routes.rag        import router as rag_router
from src.api.routes.ingestion  import router as ingestion_router

app.include_router(auth_router,       prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(prediction_router, prefix="/api/v1",      tags=["ML Prediction"])
app.include_router(analysis_router,   prefix="/api/v1",      tags=["Full Analysis"])
app.include_router(rag_router,        prefix="/api/v1/rag",  tags=["RAG Chatbot"])
app.include_router(ingestion_router,  prefix="/api/v1/ingest", tags=["Data Ingestion"])


# ── Root + Health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "running", "version": settings.VERSION, "app": settings.APP_NAME}


@app.get("/health", tags=["Health"])
def health():
    from src.database.connection import engine
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"

    return {
        "status":   "healthy" if db_status == "connected" else "degraded",
        "version":  settings.VERSION,
        "env":      settings.ENV,
        "database": db_status,
    }
