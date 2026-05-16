"""Pydantic schemas for Kubernetes resources."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Enums
# ============================================================================

class PodPhase(str, Enum):
    """Pod lifecycle phases."""
    PENDING = "Pending"
    CONTAINER_CREATING = "ContainerCreating"
    RUNNING = "Running"
    SUCCEEDED = "Succeeded"
    FAILED = "Failed"
    TERMINATING = "Terminating"
    UNKNOWN = "Unknown"


class ServiceType(str, Enum):
    """Kubernetes service types."""
    CLUSTER_IP = "ClusterIP"
    NODE_PORT = "NodePort"
    LOAD_BALANCER = "LoadBalancer"
    EXTERNAL_NAME = "ExternalName"


class SecretType(str, Enum):
    """Kubernetes secret types."""
    OPAQUE = "Opaque"
    TLS = "kubernetes.io/tls"
    DOCKER_CONFIG = "kubernetes.io/dockerconfigjson"
    SERVICE_ACCOUNT = "kubernetes.io/service-account-token"


class NodeConditionType(str, Enum):
    """Node condition types."""
    READY = "Ready"
    MEMORY_PRESSURE = "MemoryPressure"
    DISK_PRESSURE = "DiskPressure"
    PID_PRESSURE = "PIDPressure"
    NETWORK_UNAVAILABLE = "NetworkUnavailable"


class DeploymentStrategy(str, Enum):
    """Deployment update strategies."""
    ROLLING_UPDATE = "RollingUpdate"
    RECREATE = "Recreate"


class ResourceType(str, Enum):
    """All supported resource types."""
    POD = "Pod"
    DEPLOYMENT = "Deployment"
    SERVICE = "Service"
    INGRESS = "Ingress"
    CONFIG_MAP = "ConfigMap"
    SECRET = "Secret"
    HPA = "HorizontalPodAutoscaler"
    NODE = "Node"


# ============================================================================
# Base Schemas
# ============================================================================

class ObjectMeta(BaseModel):
    """Kubernetes object metadata."""
    name: str = Field(..., min_length=1, max_length=253)
    namespace: str = Field(default="default", min_length=1, max_length=63)
    uid: Optional[UUID] = None
    labels: dict[str, str] = Field(default_factory=dict)
    annotations: dict[str, str] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate DNS-1123 subdomain name."""
        import re
        if not re.match(r"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", v):
            raise ValueError(
                "Name must be lowercase alphanumeric, may contain hyphens, "
                "and must start/end with alphanumeric"
            )
        return v


class ResourceRequirements(BaseModel):
    """Container resource requirements."""
    cpu_millicores: int = Field(default=100, ge=0, le=64000)
    memory_mb: int = Field(default=128, ge=0, le=1048576)


class ResourceLimits(BaseModel):
    """Resource requests and limits."""
    requests: ResourceRequirements = Field(default_factory=ResourceRequirements)
    limits: ResourceRequirements = Field(default_factory=ResourceRequirements)


# ============================================================================
# Container Schemas
# ============================================================================

class ContainerPort(BaseModel):
    """Container port configuration."""
    name: Optional[str] = None
    container_port: int = Field(..., ge=1, le=65535)
    protocol: str = Field(default="TCP", pattern="^(TCP|UDP|SCTP)$")


class EnvVar(BaseModel):
    """Environment variable."""
    name: str
    value: Optional[str] = None
    value_from_config_map: Optional[str] = None
    value_from_secret: Optional[str] = None


class VolumeMount(BaseModel):
    """Volume mount configuration."""
    name: str
    mount_path: str
    read_only: bool = False


class Container(BaseModel):
    """Container specification."""
    name: str = Field(..., min_length=1, max_length=63)
    image: str = Field(..., min_length=1)
    image_pull_policy: str = Field(default="IfNotPresent")
    command: list[str] = Field(default_factory=list)
    args: list[str] = Field(default_factory=list)
    ports: list[ContainerPort] = Field(default_factory=list)
    env: list[EnvVar] = Field(default_factory=list)
    resources: ResourceLimits = Field(default_factory=ResourceLimits)
    volume_mounts: list[VolumeMount] = Field(default_factory=list)


class ContainerStatus(BaseModel):
    """Container runtime status."""
    name: str
    ready: bool = False
    started: bool = False
    restart_count: int = 0
    state: str = "waiting"
    last_state: Optional[str] = None
    image: str = ""
    image_id: Optional[str] = None
    container_id: Optional[str] = None


# ============================================================================
# Pod Schemas
# ============================================================================

class PodSpec(BaseModel):
    """Pod specification."""
    containers: list[Container] = Field(..., min_length=1)
    init_containers: list[Container] = Field(default_factory=list)
    restart_policy: str = Field(default="Always", pattern="^(Always|OnFailure|Never)$")
    node_selector: dict[str, str] = Field(default_factory=dict)
    service_account_name: str = Field(default="default")
    termination_grace_period_seconds: int = Field(default=30, ge=0)


class PodStatus(BaseModel):
    """Pod status information."""
    phase: PodPhase = PodPhase.PENDING
    conditions: list[dict] = Field(default_factory=list)
    host_ip: Optional[str] = None
    pod_ip: Optional[str] = None
    start_time: Optional[datetime] = None
    container_statuses: list[ContainerStatus] = Field(default_factory=list)
    node_name: Optional[str] = None


class PodCreate(BaseModel):
    """Schema for creating a pod."""
    metadata: ObjectMeta
    spec: PodSpec


class Pod(BaseModel):
    """Complete pod resource."""
    api_version: str = Field(default="v1", frozen=True)
    kind: str = Field(default="Pod", frozen=True)
    metadata: ObjectMeta
    spec: PodSpec
    status: PodStatus = Field(default_factory=PodStatus)


# ============================================================================
# Deployment Schemas
# ============================================================================

class LabelSelector(BaseModel):
    """Label selector for matching pods."""
    match_labels: dict[str, str] = Field(default_factory=dict)


class RollingUpdateStrategy(BaseModel):
    """Rolling update configuration."""
    max_unavailable: int | str = Field(default=1)
    max_surge: int | str = Field(default=1)


class DeploymentSpec(BaseModel):
    """Deployment specification."""
    replicas: int = Field(default=1, ge=0, le=1000)
    selector: LabelSelector
    template: PodCreate
    strategy: DeploymentStrategy = DeploymentStrategy.ROLLING_UPDATE
    rolling_update: Optional[RollingUpdateStrategy] = None
    min_ready_seconds: int = Field(default=0, ge=0)
    revision_history_limit: int = Field(default=10, ge=0)


class DeploymentStatus(BaseModel):
    """Deployment status information."""
    replicas: int = 0
    ready_replicas: int = 0
    available_replicas: int = 0
    unavailable_replicas: int = 0
    updated_replicas: int = 0
    observed_generation: int = 0
    conditions: list[dict] = Field(default_factory=list)


class DeploymentCreate(BaseModel):
    """Schema for creating a deployment."""
    metadata: ObjectMeta
    spec: DeploymentSpec


class Deployment(BaseModel):
    """Complete deployment resource."""
    api_version: str = Field(default="apps/v1", frozen=True)
    kind: str = Field(default="Deployment", frozen=True)
    metadata: ObjectMeta
    spec: DeploymentSpec
    status: DeploymentStatus = Field(default_factory=DeploymentStatus)


# ============================================================================
# Service Schemas
# ============================================================================

class ServicePort(BaseModel):
    """Service port configuration."""
    name: Optional[str] = None
    port: int = Field(..., ge=1, le=65535)
    target_port: int | str = Field(default=80)
    protocol: str = Field(default="TCP", pattern="^(TCP|UDP|SCTP)$")
    node_port: Optional[int] = Field(default=None, ge=30000, le=32767)


class ServiceSpec(BaseModel):
    """Service specification."""
    type: ServiceType = ServiceType.CLUSTER_IP
    selector: dict[str, str] = Field(default_factory=dict)
    ports: list[ServicePort] = Field(..., min_length=1)
    cluster_ip: Optional[str] = None
    external_ips: list[str] = Field(default_factory=list)
    load_balancer_ip: Optional[str] = None
    session_affinity: str = Field(default="None", pattern="^(None|ClientIP)$")


class ServiceStatus(BaseModel):
    """Service status information."""
    load_balancer_ingress: list[dict] = Field(default_factory=list)


class ServiceCreate(BaseModel):
    """Schema for creating a service."""
    metadata: ObjectMeta
    spec: ServiceSpec


class Service(BaseModel):
    """Complete service resource."""
    api_version: str = Field(default="v1", frozen=True)
    kind: str = Field(default="Service", frozen=True)
    metadata: ObjectMeta
    spec: ServiceSpec
    status: ServiceStatus = Field(default_factory=ServiceStatus)


# ============================================================================
# Ingress Schemas
# ============================================================================

class IngressPath(BaseModel):
    """Ingress path configuration."""
    path: str = Field(default="/")
    path_type: str = Field(default="Prefix", pattern="^(Exact|Prefix|ImplementationSpecific)$")
    backend_service_name: str
    backend_service_port: int = Field(..., ge=1, le=65535)


class IngressRule(BaseModel):
    """Ingress rule configuration."""
    host: Optional[str] = None
    paths: list[IngressPath] = Field(..., min_length=1)


class IngressTLS(BaseModel):
    """Ingress TLS configuration."""
    hosts: list[str] = Field(default_factory=list)
    secret_name: str


class IngressSpec(BaseModel):
    """Ingress specification."""
    ingress_class_name: Optional[str] = Field(default="nginx")
    rules: list[IngressRule] = Field(..., min_length=1)
    tls: list[IngressTLS] = Field(default_factory=list)


class IngressStatus(BaseModel):
    """Ingress status information."""
    load_balancer_ingress: list[dict] = Field(default_factory=list)


class IngressCreate(BaseModel):
    """Schema for creating an ingress."""
    metadata: ObjectMeta
    spec: IngressSpec


class Ingress(BaseModel):
    """Complete ingress resource."""
    api_version: str = Field(default="networking.k8s.io/v1", frozen=True)
    kind: str = Field(default="Ingress", frozen=True)
    metadata: ObjectMeta
    spec: IngressSpec
    status: IngressStatus = Field(default_factory=IngressStatus)


# ============================================================================
# ConfigMap Schemas
# ============================================================================

class ConfigMapCreate(BaseModel):
    """Schema for creating a ConfigMap."""
    metadata: ObjectMeta
    data: dict[str, str] = Field(default_factory=dict)
    binary_data: dict[str, str] = Field(default_factory=dict)


class ConfigMap(BaseModel):
    """Complete ConfigMap resource."""
    api_version: str = Field(default="v1", frozen=True)
    kind: str = Field(default="ConfigMap", frozen=True)
    metadata: ObjectMeta
    data: dict[str, str] = Field(default_factory=dict)
    binary_data: dict[str, str] = Field(default_factory=dict)


# ============================================================================
# Secret Schemas
# ============================================================================

class SecretCreate(BaseModel):
    """Schema for creating a Secret."""
    metadata: ObjectMeta
    type: SecretType = SecretType.OPAQUE
    data: dict[str, str] = Field(default_factory=dict)
    string_data: dict[str, str] = Field(default_factory=dict)


class Secret(BaseModel):
    """Complete Secret resource."""
    api_version: str = Field(default="v1", frozen=True)
    kind: str = Field(default="Secret", frozen=True)
    metadata: ObjectMeta
    type: SecretType = SecretType.OPAQUE
    data: dict[str, str] = Field(default_factory=dict)


# ============================================================================
# HPA Schemas
# ============================================================================

class MetricSpec(BaseModel):
    """HPA metric specification."""
    type: str = Field(default="Resource", pattern="^(Resource|Pods|Object|External)$")
    resource_name: str = Field(default="cpu")
    target_type: str = Field(default="Utilization", pattern="^(Utilization|Value|AverageValue)$")
    target_value: int = Field(default=80, ge=1, le=100)


class HPASpec(BaseModel):
    """HPA specification."""
    scale_target_ref_kind: str = Field(default="Deployment")
    scale_target_ref_name: str
    min_replicas: int = Field(default=1, ge=1)
    max_replicas: int = Field(default=10, ge=1)
    metrics: list[MetricSpec] = Field(default_factory=lambda: [MetricSpec()])


class HPAStatus(BaseModel):
    """HPA status information."""
    current_replicas: int = 0
    desired_replicas: int = 0
    current_metrics: list[dict] = Field(default_factory=list)
    last_scale_time: Optional[datetime] = None


class HPACreate(BaseModel):
    """Schema for creating an HPA."""
    metadata: ObjectMeta
    spec: HPASpec


class HPA(BaseModel):
    """Complete HPA resource."""
    api_version: str = Field(default="autoscaling/v2", frozen=True)
    kind: str = Field(default="HorizontalPodAutoscaler", frozen=True)
    metadata: ObjectMeta
    spec: HPASpec
    status: HPAStatus = Field(default_factory=HPAStatus)


# ============================================================================
# Node Schemas
# ============================================================================

class NodeCondition(BaseModel):
    """Node condition."""
    type: NodeConditionType
    status: str = Field(default="True", pattern="^(True|False|Unknown)$")
    reason: Optional[str] = None
    message: Optional[str] = None
    last_heartbeat_time: Optional[datetime] = None
    last_transition_time: Optional[datetime] = None


class NodeResources(BaseModel):
    """Node resource capacity/allocatable."""
    cpu_millicores: int = Field(default=4000)
    memory_mb: int = Field(default=8192)
    pods: int = Field(default=110)


class NodeSpec(BaseModel):
    """Node specification."""
    pod_cidr: Optional[str] = None
    provider_id: Optional[str] = None
    unschedulable: bool = False
    taints: list[dict] = Field(default_factory=list)


class NodeStatus(BaseModel):
    """Node status information."""
    conditions: list[NodeCondition] = Field(default_factory=list)
    capacity: NodeResources = Field(default_factory=NodeResources)
    allocatable: NodeResources = Field(default_factory=NodeResources)
    allocated: NodeResources = Field(default_factory=lambda: NodeResources(cpu_millicores=0, memory_mb=0, pods=0))
    node_info: dict = Field(default_factory=dict)
    addresses: list[dict] = Field(default_factory=list)


class Node(BaseModel):
    """Complete Node resource."""
    api_version: str = Field(default="v1", frozen=True)
    kind: str = Field(default="Node", frozen=True)
    metadata: ObjectMeta
    spec: NodeSpec = Field(default_factory=NodeSpec)
    status: NodeStatus = Field(default_factory=NodeStatus)
    role: str = Field(default="worker", pattern="^(master|worker)$")
