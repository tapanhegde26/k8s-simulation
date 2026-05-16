"""Pydantic schemas for learning scenarios."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    """Scenario difficulty levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ObjectiveType(str, Enum):
    """Types of scenario objectives."""
    CREATE_RESOURCE = "create_resource"
    DELETE_RESOURCE = "delete_resource"
    SCALE_DEPLOYMENT = "scale_deployment"
    UPDATE_RESOURCE = "update_resource"
    WAIT_FOR_CONDITION = "wait_for_condition"
    CUSTOM = "custom"


class Objective(BaseModel):
    """Scenario objective."""
    id: str
    title: str
    description: str
    type: ObjectiveType
    target: dict[str, Any] = Field(default_factory=dict)
    completed: bool = False
    order: int = 0


class Hint(BaseModel):
    """Progressive hint for scenario."""
    id: str
    text: str
    reveal_after_seconds: int = 60
    revealed: bool = False


class ScenarioStory(BaseModel):
    """Narrative context for scenario."""
    character: str = "You"
    role: str = "Kubernetes Administrator"
    situation: str
    goal: str
    success_message: str


class ScenarioCreate(BaseModel):
    """Schema for creating a scenario."""
    title: str = Field(..., min_length=1, max_length=100)
    description: str
    difficulty: Difficulty
    estimated_minutes: int = Field(default=10, ge=1, le=120)
    concepts: list[str] = Field(default_factory=list)
    objectives: list[Objective]
    hints: list[Hint] = Field(default_factory=list)
    story: Optional[ScenarioStory] = None
    initial_state: dict[str, Any] = Field(default_factory=dict)


class Scenario(BaseModel):
    """Complete scenario resource."""
    id: UUID
    title: str
    description: str
    difficulty: Difficulty
    estimated_minutes: int
    concepts: list[str]
    objectives: list[Objective]
    hints: list[Hint]
    story: Optional[ScenarioStory] = None
    initial_state: dict[str, Any]
    created_at: datetime


class ScenarioProgress(BaseModel):
    """User progress in a scenario."""
    scenario_id: UUID
    cluster_id: UUID
    started_at: datetime
    completed_at: Optional[datetime] = None
    objectives_completed: list[str] = Field(default_factory=list)
    hints_revealed: list[str] = Field(default_factory=list)
    elapsed_seconds: int = 0
    is_completed: bool = False


class ScenarioSummary(BaseModel):
    """Scenario summary for list views."""
    id: UUID
    title: str
    description: str
    difficulty: Difficulty
    estimated_minutes: int
    concepts: list[str]
    objectives_count: int


# Pre-defined scenarios
BUILTIN_SCENARIOS: list[dict] = [
    {
        "title": "Your First Pod",
        "description": "Learn the basics of Kubernetes by deploying your first pod.",
        "difficulty": Difficulty.BEGINNER,
        "estimated_minutes": 5,
        "concepts": ["pods", "containers", "kubectl"],
        "story": {
            "character": "Alex",
            "role": "Junior DevOps Engineer",
            "situation": "It's your first day on the job, and your team lead asks you to deploy a simple nginx web server to the cluster.",
            "goal": "Create a pod running nginx and verify it's running.",
            "success_message": "Congratulations! You've deployed your first pod. The nginx server is now running in your cluster.",
        },
        "objectives": [
            {
                "id": "create-nginx-pod",
                "title": "Create nginx Pod",
                "description": "Create a pod named 'my-nginx' running the nginx:latest image",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "Pod", "name": "my-nginx", "image": "nginx"},
                "order": 1,
            },
            {
                "id": "verify-running",
                "title": "Verify Pod Running",
                "description": "Wait for the pod to reach 'Running' status",
                "type": ObjectiveType.WAIT_FOR_CONDITION,
                "target": {"kind": "Pod", "name": "my-nginx", "condition": "Running"},
                "order": 2,
            },
        ],
        "hints": [
            {"id": "hint-1", "text": "Use the Interactive Lab to create a new Pod resource.", "reveal_after_seconds": 30},
            {"id": "hint-2", "text": "Set the pod name to 'my-nginx' and image to 'nginx:latest'.", "reveal_after_seconds": 60},
        ],
    },
    {
        "title": "Scaling with Deployments",
        "description": "Learn how to use Deployments to manage multiple pod replicas.",
        "difficulty": Difficulty.BEGINNER,
        "estimated_minutes": 10,
        "concepts": ["deployments", "replicas", "scaling"],
        "story": {
            "character": "Alex",
            "role": "Junior DevOps Engineer",
            "situation": "Traffic to your nginx server is increasing. Your team lead wants you to scale up to handle the load.",
            "goal": "Create a deployment with 3 replicas and then scale it to 5.",
            "success_message": "Excellent! You've mastered basic scaling. Your application can now handle more traffic.",
        },
        "objectives": [
            {
                "id": "create-deployment",
                "title": "Create Deployment",
                "description": "Create a deployment named 'nginx-deployment' with 3 replicas",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "Deployment", "name": "nginx-deployment", "replicas": 3},
                "order": 1,
            },
            {
                "id": "scale-deployment",
                "title": "Scale to 5 Replicas",
                "description": "Scale the deployment to 5 replicas",
                "type": ObjectiveType.SCALE_DEPLOYMENT,
                "target": {"name": "nginx-deployment", "replicas": 5},
                "order": 2,
            },
        ],
        "hints": [
            {"id": "hint-1", "text": "Create a Deployment from the Interactive Lab.", "reveal_after_seconds": 30},
            {"id": "hint-2", "text": "Use the scale controls in the Resources tab to adjust replicas.", "reveal_after_seconds": 90},
        ],
    },
    {
        "title": "Exposing Your Application",
        "description": "Learn how to expose your application using Services.",
        "difficulty": Difficulty.BEGINNER,
        "estimated_minutes": 10,
        "concepts": ["services", "ClusterIP", "LoadBalancer", "networking"],
        "story": {
            "character": "Alex",
            "role": "Junior DevOps Engineer",
            "situation": "Your nginx deployment is running, but other services can't reach it. You need to create a Service to expose it.",
            "goal": "Create a ClusterIP service, then upgrade it to a LoadBalancer.",
            "success_message": "Your application is now accessible! Services provide stable networking for your pods.",
        },
        "objectives": [
            {
                "id": "create-service",
                "title": "Create ClusterIP Service",
                "description": "Create a ClusterIP service named 'nginx-service' targeting port 80",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "Service", "name": "nginx-service", "type": "ClusterIP"},
                "order": 1,
            },
        ],
        "hints": [
            {"id": "hint-1", "text": "Services use label selectors to find pods. Make sure your selector matches your deployment's labels.", "reveal_after_seconds": 45},
        ],
    },
    {
        "title": "Auto-Scaling with HPA",
        "description": "Set up Horizontal Pod Autoscaler to automatically scale based on CPU usage.",
        "difficulty": Difficulty.INTERMEDIATE,
        "estimated_minutes": 15,
        "concepts": ["HPA", "autoscaling", "metrics", "CPU"],
        "story": {
            "character": "Jordan",
            "role": "Platform Engineer",
            "situation": "Your application experiences variable traffic throughout the day. Manual scaling isn't sustainable.",
            "goal": "Configure HPA to automatically scale between 2 and 10 replicas based on CPU usage.",
            "success_message": "Auto-scaling is configured! Your cluster will now automatically adjust to traffic demands.",
        },
        "objectives": [
            {
                "id": "create-deployment",
                "title": "Create Target Deployment",
                "description": "Create a deployment named 'web-app' with 2 replicas",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "Deployment", "name": "web-app", "replicas": 2},
                "order": 1,
            },
            {
                "id": "create-hpa",
                "title": "Create HPA",
                "description": "Create an HPA targeting 'web-app' with min=2, max=10, target CPU=50%",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "HorizontalPodAutoscaler", "name": "web-app-hpa", "targetCPU": 50},
                "order": 2,
            },
            {
                "id": "trigger-scale",
                "title": "Trigger Scale Up",
                "description": "Simulate load to trigger the HPA to scale up",
                "type": ObjectiveType.WAIT_FOR_CONDITION,
                "target": {"kind": "Deployment", "name": "web-app", "minReplicas": 4},
                "order": 3,
            },
        ],
        "hints": [
            {"id": "hint-1", "text": "First create the deployment, then create an HPA that references it.", "reveal_after_seconds": 60},
            {"id": "hint-2", "text": "Use the load simulator slider in the Resources tab to increase CPU usage.", "reveal_after_seconds": 120},
        ],
    },
    {
        "title": "Configuration Management",
        "description": "Learn to manage application configuration with ConfigMaps and Secrets.",
        "difficulty": Difficulty.INTERMEDIATE,
        "estimated_minutes": 15,
        "concepts": ["ConfigMaps", "Secrets", "environment variables", "configuration"],
        "story": {
            "character": "Jordan",
            "role": "Platform Engineer",
            "situation": "Your application needs database credentials and feature flags. Hardcoding these values is a security risk.",
            "goal": "Create a ConfigMap for feature flags and a Secret for database credentials.",
            "success_message": "Configuration externalized! Your application can now be configured without rebuilding images.",
        },
        "objectives": [
            {
                "id": "create-configmap",
                "title": "Create ConfigMap",
                "description": "Create a ConfigMap named 'app-config' with key 'FEATURE_FLAG=enabled'",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "ConfigMap", "name": "app-config"},
                "order": 1,
            },
            {
                "id": "create-secret",
                "title": "Create Secret",
                "description": "Create a Secret named 'db-credentials' with database connection info",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "Secret", "name": "db-credentials"},
                "order": 2,
            },
        ],
        "hints": [
            {"id": "hint-1", "text": "ConfigMaps store non-sensitive configuration data.", "reveal_after_seconds": 30},
            {"id": "hint-2", "text": "Secrets are similar to ConfigMaps but are base64 encoded and meant for sensitive data.", "reveal_after_seconds": 60},
        ],
    },
    {
        "title": "Node Failure Recovery",
        "description": "Understand how Kubernetes handles node failures and pod rescheduling.",
        "difficulty": Difficulty.ADVANCED,
        "estimated_minutes": 20,
        "concepts": ["node failure", "pod eviction", "rescheduling", "high availability"],
        "story": {
            "character": "Sam",
            "role": "Site Reliability Engineer",
            "situation": "One of your worker nodes is showing signs of hardware failure. You need to gracefully drain it and observe how Kubernetes handles the situation.",
            "goal": "Simulate a node failure and observe pod rescheduling to healthy nodes.",
            "success_message": "Disaster recovery successful! Kubernetes automatically rescheduled your workloads to healthy nodes.",
        },
        "objectives": [
            {
                "id": "create-deployment",
                "title": "Deploy Application",
                "description": "Create a deployment with 4 replicas spread across nodes",
                "type": ObjectiveType.CREATE_RESOURCE,
                "target": {"kind": "Deployment", "name": "resilient-app", "replicas": 4},
                "order": 1,
            },
            {
                "id": "verify-distribution",
                "title": "Verify Pod Distribution",
                "description": "Confirm pods are distributed across multiple nodes",
                "type": ObjectiveType.WAIT_FOR_CONDITION,
                "target": {"kind": "Deployment", "name": "resilient-app", "condition": "distributed"},
                "order": 2,
            },
            {
                "id": "simulate-failure",
                "title": "Simulate Node Failure",
                "description": "Mark a worker node as unschedulable (cordon)",
                "type": ObjectiveType.CUSTOM,
                "target": {"action": "cordon_node"},
                "order": 3,
            },
            {
                "id": "verify-recovery",
                "title": "Verify Recovery",
                "description": "Confirm all pods are rescheduled and running",
                "type": ObjectiveType.WAIT_FOR_CONDITION,
                "target": {"kind": "Deployment", "name": "resilient-app", "condition": "all_running"},
                "order": 4,
            },
        ],
        "hints": [
            {"id": "hint-1", "text": "Watch the Cluster Architecture view to see pod distribution across nodes.", "reveal_after_seconds": 60},
            {"id": "hint-2", "text": "When a node fails, the scheduler will automatically place pods on healthy nodes.", "reveal_after_seconds": 120},
        ],
    },
]
