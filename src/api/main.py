"""
File: src/api/main.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes.prediction import router as prediction_router
from src.api.routes.analysis   import router as analysis_router
from src.api.routes.rag        import router as rag_router
from src.api.routes.auth       import router as auth_router

app = FastAPI(
    title   = "Clinical Early Warning System API",
    version = "1.0.0",
    docs_url= "/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_methods     = ["*"],
    allow_headers     = ["*"],
    allow_credentials = False,
)

app.include_router(auth_router,       prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(prediction_router, prefix="/api/v1",      tags=["ML Prediction"])
app.include_router(analysis_router,   prefix="/api/v1",      tags=["Full Analysis"])
app.include_router(rag_router,        prefix="/api/v1/rag",  tags=["RAG"])

@app.get("/")
def root():
    return {"status": "running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}