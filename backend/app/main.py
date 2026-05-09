"""Main FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1 import cluster, resources, scenarios
from app.api.websocket import router as ws_router
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    await init_db()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## Kubernetes Cluster Simulation API
    
    An educational API for simulating Kubernetes cluster operations.
    
    ### Features
    - Create and manage simulated K8s clusters
    - Deploy pods, deployments, services, and other resources
    - Real-time events via WebSocket
    - Learning scenarios with objectives
    
    ### WebSocket
    Connect to `/ws/clusters/{cluster_id}/events` for real-time cluster events.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cluster.router, prefix="/api/v1", tags=["Clusters"])
app.include_router(resources.router, prefix="/api/v1", tags=["Resources"])
app.include_router(scenarios.router, prefix="/api/v1", tags=["Scenarios"])
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint returning API info."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "ok",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "environment": settings.environment}
