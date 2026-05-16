"""Pydantic schemas for WebSocket events."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EventType(str, Enum):
    """WebSocket event types."""
    # Connection events
    CONNECTED = "connection.established"
    HEARTBEAT = "connection.heartbeat"
    
    # Cluster events
    CLUSTER_CREATED = "cluster.created"
    CLUSTER_UPDATED = "cluster.updated"
    CLUSTER_DELETED = "cluster.deleted"
    
    # Node events
    NODE_ADDED = "node.added"
    NODE_REMOVED = "node.removed"
    NODE_READY = "node.ready"
    NODE_NOT_READY = "node.not_ready"
    NODE_RESOURCE_UPDATED = "node.resource_updated"
    
    # Pod events
    POD_CREATED = "pod.created"
    POD_SCHEDULED = "pod.scheduled"
    POD_STARTED = "pod.started"
    POD_RUNNING = "pod.running"
    POD_SUCCEEDED = "pod.succeeded"
    POD_FAILED = "pod.failed"
    POD_DELETED = "pod.deleted"
    POD_EVICTED = "pod.evicted"
    
    # Pod creation flow events (detailed steps)
    POD_FLOW_KUBECTL_REQUEST = "pod.flow.kubectl_request"
    POD_FLOW_API_AUTH = "pod.flow.api_auth"
    POD_FLOW_ADMISSION = "pod.flow.admission"
    POD_FLOW_ETCD_PERSIST = "pod.flow.etcd_persist"
    POD_FLOW_SCHEDULER_WATCH = "pod.flow.scheduler_watch"
    POD_FLOW_NODE_FILTER = "pod.flow.node_filter"
    POD_FLOW_NODE_SCORE = "pod.flow.node_score"
    POD_FLOW_BIND = "pod.flow.bind"
    POD_FLOW_KUBELET_WATCH = "pod.flow.kubelet_watch"
    POD_FLOW_CRI_INVOKE = "pod.flow.cri_invoke"
    POD_FLOW_IMAGE_PULL = "pod.flow.image_pull"
    POD_FLOW_CONTAINER_CREATE = "pod.flow.container_create"
    POD_FLOW_CONTAINER_START = "pod.flow.container_start"
    POD_FLOW_RUNNING = "pod.flow.running"
    
    # Deployment events
    DEPLOYMENT_CREATED = "deployment.created"
    DEPLOYMENT_UPDATED = "deployment.updated"
    DEPLOYMENT_SCALED = "deployment.scaled"
    DEPLOYMENT_ROLLING_UPDATE = "deployment.rolling_update"
    DEPLOYMENT_DELETED = "deployment.deleted"
    
    # Service events
    SERVICE_CREATED = "service.created"
    SERVICE_UPDATED = "service.updated"
    SERVICE_DELETED = "service.deleted"
    
    # HPA events
    HPA_CREATED = "hpa.created"
    HPA_TRIGGERED = "hpa.triggered"
    HPA_SCALED_UP = "hpa.scaled_up"
    HPA_SCALED_DOWN = "hpa.scaled_down"
    HPA_DELETED = "hpa.deleted"
    
    # Other resource events
    CONFIGMAP_CREATED = "configmap.created"
    CONFIGMAP_UPDATED = "configmap.updated"
    CONFIGMAP_DELETED = "configmap.deleted"
    SECRET_CREATED = "secret.created"
    SECRET_DELETED = "secret.deleted"
    INGRESS_CREATED = "ingress.created"
    INGRESS_DELETED = "ingress.deleted"
    
    # Scenario events
    SCENARIO_STARTED = "scenario.started"
    SCENARIO_OBJECTIVE_COMPLETED = "scenario.objective_completed"
    SCENARIO_COMPLETED = "scenario.completed"
    SCENARIO_FAILED = "scenario.failed"
    
    # Error events
    ERROR = "error"
    SCHEDULING_FAILED = "scheduling.failed"
    RESOURCE_QUOTA_EXCEEDED = "resource.quota_exceeded"


class EventSeverity(str, Enum):
    """Event severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


class ClusterEvent(BaseModel):
    """WebSocket event payload."""
    id: UUID
    type: EventType
    severity: EventSeverity = EventSeverity.INFO
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cluster_id: UUID
    resource_type: Optional[str] = None
    resource_name: Optional[str] = None
    resource_namespace: Optional[str] = None
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class PodCreationFlowStep(BaseModel):
    """Detailed step in pod creation flow."""
    step_number: int
    event_type: EventType
    title: str
    description: str
    component: str
    duration_ms: int = 500
    details: dict[str, Any] = Field(default_factory=dict)


# Pre-defined pod creation flow steps
POD_CREATION_FLOW_STEPS: list[PodCreationFlowStep] = [
    PodCreationFlowStep(
        step_number=1,
        event_type=EventType.POD_FLOW_KUBECTL_REQUEST,
        title="kubectl Request",
        description="User submits pod creation request via kubectl",
        component="kubectl",
        duration_ms=200,
    ),
    PodCreationFlowStep(
        step_number=2,
        event_type=EventType.POD_FLOW_API_AUTH,
        title="API Server Authentication",
        description="API Server authenticates and authorizes the request",
        component="kube-apiserver",
        duration_ms=300,
    ),
    PodCreationFlowStep(
        step_number=3,
        event_type=EventType.POD_FLOW_ADMISSION,
        title="Admission Control",
        description="Admission controllers validate and mutate the pod spec",
        component="kube-apiserver",
        duration_ms=400,
    ),
    PodCreationFlowStep(
        step_number=4,
        event_type=EventType.POD_FLOW_ETCD_PERSIST,
        title="Persist to etcd",
        description="Pod object is persisted to etcd datastore",
        component="etcd",
        duration_ms=300,
    ),
    PodCreationFlowStep(
        step_number=5,
        event_type=EventType.POD_FLOW_SCHEDULER_WATCH,
        title="Scheduler Watch",
        description="Scheduler detects new unscheduled pod",
        component="kube-scheduler",
        duration_ms=200,
    ),
    PodCreationFlowStep(
        step_number=6,
        event_type=EventType.POD_FLOW_NODE_FILTER,
        title="Node Filtering",
        description="Scheduler filters nodes based on predicates (resources, taints, affinity)",
        component="kube-scheduler",
        duration_ms=500,
    ),
    PodCreationFlowStep(
        step_number=7,
        event_type=EventType.POD_FLOW_NODE_SCORE,
        title="Node Scoring",
        description="Scheduler scores filtered nodes to find the best fit",
        component="kube-scheduler",
        duration_ms=400,
    ),
    PodCreationFlowStep(
        step_number=8,
        event_type=EventType.POD_FLOW_BIND,
        title="Bind to Node",
        description="Scheduler binds pod to selected node",
        component="kube-scheduler",
        duration_ms=300,
    ),
    PodCreationFlowStep(
        step_number=9,
        event_type=EventType.POD_FLOW_KUBELET_WATCH,
        title="Kubelet Watch",
        description="Kubelet on target node detects new pod assignment",
        component="kubelet",
        duration_ms=200,
    ),
    PodCreationFlowStep(
        step_number=10,
        event_type=EventType.POD_FLOW_CRI_INVOKE,
        title="CRI Invocation",
        description="Kubelet invokes Container Runtime Interface",
        component="kubelet",
        duration_ms=300,
    ),
    PodCreationFlowStep(
        step_number=11,
        event_type=EventType.POD_FLOW_IMAGE_PULL,
        title="Image Pull",
        description="Container runtime pulls the container image",
        component="containerd",
        duration_ms=2000,
    ),
    PodCreationFlowStep(
        step_number=12,
        event_type=EventType.POD_FLOW_CONTAINER_CREATE,
        title="Container Create",
        description="Container runtime creates the container",
        component="containerd",
        duration_ms=500,
    ),
    PodCreationFlowStep(
        step_number=13,
        event_type=EventType.POD_FLOW_CONTAINER_START,
        title="Container Start",
        description="Container runtime starts the container process",
        component="containerd",
        duration_ms=400,
    ),
    PodCreationFlowStep(
        step_number=14,
        event_type=EventType.POD_FLOW_RUNNING,
        title="Pod Running",
        description="Pod is now running and ready to serve traffic",
        component="pod",
        duration_ms=200,
    ),
]
