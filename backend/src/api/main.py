"""FastAPI application entry point for entra-nhi-oauth-auditor backend."""

import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from src.api.pipeline import run_pipeline
from src.api.audit import router as audit_router
from src.api.identities import router as identities_router
from src.api.findings import router as findings_router
from src.api.reports import router as reports_router

app = FastAPI(
    title="NHI OAuth Auditor API",
    version="1.0.0",
    description="Non-Human Identity (NHI) and OAuth Integration Risk Auditor API in safe synthetic mode.",
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Auto-run pipeline on startup so first page load always has data."""
    run_pipeline()


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
    pipeline_data = run_pipeline()
    summary = pipeline_data.get("summary", {})
    total_identities = pipeline_data.get("total_identities", 0)
    total_findings = len(pipeline_data.get("findings", []))
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

@api_router.get("/identities")
def list_identities(
    type: Optional[str] = Query(None, description="Identity type filter"),
    risk_level: Optional[str] = Query(None, description="Risk level filter"),
    search: Optional[str] = Query(None, description="Search keyword by name or appId"),
):
    """Lists non-human identities with optional filtering."""
    return inventory_service.list_identities(
        identity_type=type,
        risk_level=risk_level,
        search=search,
    )

@api_router.get("/identities/{identity_id}")
def get_identity(identity_id: str):
    """Fetches details for a specific non-human identity."""
    identity = inventory_service.get_identity_by_id(identity_id)
    if not identity:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found.")
    
    analysis = oauth_analyzer.inspect_permissions(identity.get("oauth_permissions", []))
    findings = risk_engine.list_findings(identity_id=identity["id"])

# Register all routers under /api/v1
api_router.include_router(audit_router)
api_router.include_router(identities_router)
api_router.include_router(findings_router)
api_router.include_router(reports_router)

@api_router.post("/audit/run")
def trigger_audit():
    """Executes or triggers a synthetic identity security audit scan."""
    identities = inventory_service.list_identities()
    findings = risk_engine.list_findings()
    return {
        "status": "success",
        "message": "Audit completed successfully",
        "scanned_identities": len(identities),
        "total_findings": len(findings)
    }

# Mount API router
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "NHI OAuth Auditor API is running.",
        "health_check": "/api/v1/health",
        "documentation": "/docs",
    }
