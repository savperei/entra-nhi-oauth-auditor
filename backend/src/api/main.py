"""FastAPI application entry point for entra-nhi-oauth-auditor backend."""

import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from src.api.pipeline import get_pipeline_cache
from src.api.audit import router as audit_router
from src.api.identities import router as identities_router
from src.api.findings import router as findings_router
from src.api.reports import router as reports_router

app = FastAPI(
    title="NHI OAuth Auditor API",
    version="1.0.0",
    description="Non-Human Identity (NHI) and OAuth Integration Risk Auditor API in safe synthetic mode.",
)

# Configure CORS for frontend dev origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router under /api/v1 prefix
api_router = APIRouter(prefix="/api/v1")


@api_router.get("/health")
def get_health():
    """Health check endpoint indicating synthetic data operation mode."""
    return {
        "status": "ok",
        "mode": "synthetic_data",
    }


@api_router.get("/dashboard/stats")
def get_dashboard_stats():
    """Returns dashboard summary statistics from the pipeline."""
    cache = get_pipeline_cache()
    if not cache:
        return {
            "metrics": {
                "total_identities": 0,
                "total_findings": 0,
                "critical_risk_count": 0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "low_risk_count": 0,
            },
            "environment": "Synthetic Data Mode",
            "total_rules_active": 8,
        }

    summary = cache.get("summary", {})
    total_identities = cache.get("total_identities", 0)
    total_findings = len(cache.get("findings", []))
    return {
        "metrics": {
            "total_identities": total_identities,
            "total_findings": total_findings,
            "critical_risk_count": summary.get("critical", 0),
            "high_risk_count": summary.get("high", 0),
            "medium_risk_count": summary.get("medium", 0),
            "low_risk_count": summary.get("low", 0),
        },
        "environment": "Synthetic Data Mode",
        "total_rules_active": 8,
    }


# Register sub-routers under /api/v1
api_router.include_router(audit_router)
api_router.include_router(identities_router)
api_router.include_router(findings_router)
api_router.include_router(reports_router)

# Mount API router
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "NHI OAuth Auditor API is running.",
        "health_check": "/api/v1/health",
        "documentation": "/docs",
    }
