"""FastAPI application entry point for entra-nhi-oauth-auditor backend."""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from src.inventory.service import inventory_service
from src.analyzers.oauth_analyzer import oauth_analyzer
from src.risk_engine.scorer import risk_engine
from src.reporting.generator import report_generator

app = FastAPI(
    title="Entra NHI & OAuth Auditor API",
    description="Safe local auditor for Non-Human Identities (NHI) and OAuth permissions using synthetic data.",
    version="1.0.0"
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

# API Router under /api/v1 prefix
api_router = APIRouter(prefix="/api/v1")

@api_router.get("/health")
def get_health():
    """Health check endpoint indicating synthetic data operation mode."""
    use_synthetic = os.getenv("USE_SYNTHETIC_DATA", "true").lower() == "true"
    return {
        "status": "healthy",
        "service": "entra-nhi-oauth-auditor-backend",
        "synthetic_data_mode": use_synthetic,
        "version": "1.0.0"
    }

@api_router.get("/dashboard/stats")
def get_dashboard_stats():
    """Returns dashboard summary statistics from synthetic inventory."""
    identities = inventory_service.list_identities()
    findings = risk_engine.list_findings()
    metrics = risk_engine.get_summary_metrics(identities, findings)
    return {
        "metrics": metrics,
        "environment": "Synthetic Data Mode",
        "total_rules_active": 5
    }

@api_router.get("/identities")
def list_identities():
    """Lists non-human identities."""
    return inventory_service.list_identities()

@api_router.get("/identities/{identity_id}")
def get_identity(identity_id: str):
    """Fetches details for a specific non-human identity."""
    identity = inventory_service.get_identity_by_id(identity_id)
    if not identity:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found.")
    
    analysis = oauth_analyzer.inspect_permissions(identity.get("oauth_permissions", []))
    findings = risk_engine.list_findings(identity_id=identity["id"])

    return {
        **identity,
        "permission_analysis": analysis,
        "findings": findings
    }

@api_router.get("/findings")
def list_findings():
    """Lists all synthetic audit risk findings."""
    return risk_engine.list_findings()

# Mount API router
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "message": "Entra NHI & OAuth Auditor API is running.",
        "health_check": "/api/v1/health",
        "documentation": "/docs"
    }

