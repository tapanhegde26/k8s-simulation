"""Pydantic schemas for cluster management."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.kubernetes import Node


class ClusterStatus(str, Enum):
    """Cluster lifecycle status."""
    CREATING = "Creating"
    RUNNING = "Running"
    UPDATING = "Updating"
    DEGRADED = "Degraded"
    DELETING = "Deleting"
    DELETED = "Deleted"


class ControlPlaneComponent(BaseModel):
    """Control plane component status."""
    name: str
    status: str = "Running"
    health: str = "Healthy"
    description: str = ""


class ClusterConfig(BaseModel):
    """Cluster configuration options."""
    name: str = Field(default="simulation-cluster", min_length=1, max_length=63)
    kubernetes_version: str = Field(default="1.28.0")
    master_nodes: int = Field(default=1, ge=1, le=3)
    worker_nodes: int = Field(default=2, ge=1, le=10)
    node_cpu_millicores: int = Field(default=4000, ge=1000, le=64000)
    node_memory_mb: int = Field(default=8192, ge=1024, le=262144)
    max_pods_per_node: int = Field(default=110, ge=10, le=250)
    enable_hpa: bool = True
    enable_cluster_autoscaler: bool = False
    cluster_autoscaler_min_nodes: int = Field(default=1, ge=1)
    cluster_autoscaler_max_nodes: int = Field(default=10, ge=1)


class ClusterCreate(BaseModel):
    """Schema for creating a cluster."""
    config: ClusterConfig = Field(default_factory=ClusterConfig)


class ClusterStats(BaseModel):
    """Cluster statistics."""
    total_pods: int = 0
    running_pods: int = 0
    pending_pods: int = 0
    failed_pods: int = 0
    total_deployments: int = 0
    total_services: int = 0
    total_nodes: int = 0
    ready_nodes: int = 0
    total_cpu_millicores: int = 0
    used_cpu_millicores: int = 0
    total_memory_mb: int = 0
    used_memory_mb: int = 0


class Cluster(BaseModel):
    """Complete cluster resource."""
    id: UUID
    config: ClusterConfig
    status: ClusterStatus = ClusterStatus.CREATING
    control_plane: list[ControlPlaneComponent] = Field(default_factory=list)
    nodes: list[Node] = Field(default_factory=list)
    stats: ClusterStats = Field(default_factory=ClusterStats)
    created_at: datetime
    updated_at: datetime


class ClusterSummary(BaseModel):
    """Cluster summary for list views."""
    id: UUID
    name: str
    status: ClusterStatus
    kubernetes_version: str
    node_count: int
    pod_count: int
    created_at: datetime
