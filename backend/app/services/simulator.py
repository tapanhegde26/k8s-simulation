"""Main Kubernetes cluster simulation engine."""

import asyncio
import random
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from app.config import settings
from app.core.events import event_bus
from app.core.state_machine import PodState, create_pod_state_machine
from app.schemas.cluster import (
    Cluster, ClusterConfig, ClusterStatus, ClusterStats,
    ControlPlaneComponent
)
from app.schemas.kubernetes import (
    Pod, PodCreate, PodPhase, PodStatus, PodSpec,
    Deployment, DeploymentCreate, DeploymentStatus,
    Service, ServiceCreate, ServiceStatus, ServiceType,
    Ingress, IngressCreate, IngressStatus,
    ConfigMap, ConfigMapCreate,
    Secret, SecretCreate,
    HPA, HPACreate, HPAStatus,
    Node, NodeSpec, NodeStatus, NodeCondition, NodeConditionType,
    NodeResources, ObjectMeta, Container, ContainerStatus
)
from app.schemas.events import (
    ClusterEvent, EventType, EventSeverity,
    POD_CREATION_FLOW_STEPS
)
from app.services.scheduler import Scheduler, SchedulingResult
from app.services.autoscaler import HPAController, ClusterAutoscaler


class ClusterSimulator:
    """
    Main simulation engine for a Kubernetes cluster.
    
    Manages all resources and simulates K8s behavior.
    """
    
    def __init__(self, cluster_id: UUID, config: ClusterConfig):
        self.cluster_id = cluster_id
        self.config = config
        self.created_at = datetime.utcnow()
        self.status = ClusterStatus.CREATING
        
        # Resources
        self.nodes: dict[str, Node] = {}
        self.pods: dict[str, Pod] = {}
        self.deployments: dict[str, Deployment] = {}
        self.services: dict[str, Service] = {}
        self.ingresses: dict[str, Ingress] = {}
        self.configmaps: dict[str, ConfigMap] = {}
        self.secrets: dict[str, Secret] = {}
        self.hpas: dict[str, HPA] = {}
        
        # Controllers
        self.scheduler = Scheduler()
        self.hpa_controller = HPAController()
        self.cluster_autoscaler = ClusterAutoscaler(
            min_nodes=config.cluster_autoscaler_min_nodes,
            max_nodes=config.cluster_autoscaler_max_nodes
        )
        
        # Control plane
        self.control_plane = self._init_control_plane()
        
        # Background tasks
        self._running = False
        self._tasks: list[asyncio.Task] = []
    
    def _init_control_plane(self) -> list[ControlPlaneComponent]:
        """Initialize control plane components."""
        return [
            ControlPlaneComponent(
                name="kube-apiserver",
                status="Running",
                health="Healthy",
                description="API Server - Frontend for the K8s control plane"
            ),
            ControlPlaneComponent(
                name="etcd",
                status="Running", 
                health="Healthy",
                description="etcd - Consistent and highly-available key-value store"
            ),
            ControlPlaneComponent(
                name="kube-scheduler",
                status="Running",
                health="Healthy",
                description="Scheduler - Watches for new pods and assigns them to nodes"
            ),
            ControlPlaneComponent(
                name="kube-controller-manager",
                status="Running",
                health="Healthy",
                description="Controller Manager - Runs controller processes"
            ),
            ControlPlaneComponent(
                name="cloud-controller-manager",
                status="Running",
                health="Healthy",
                description="Cloud Controller - Integrates with cloud provider APIs"
            ),
        ]
    
    async def initialize(self) -> None:
        """Initialize the cluster with nodes."""
        # Create master node
        await self._create_node("master-1", role="master")
        
        # Create worker nodes
        for i in range(self.config.worker_nodes):
            await self._create_node(f"worker-{i+1}", role="worker")
        
        self.status = ClusterStatus.RUNNING
        await self._emit_event(
            EventType.CLUSTER_CREATED,
            "Cluster initialized successfully",
            severity=EventSeverity.SUCCESS
        )
    
    async def _create_node(self, name: str, role: str = "worker") -> Node:
        """Create a new node."""
        node = Node(
            metadata=ObjectMeta(
                name=name,
                uid=uuid4(),
                labels={"kubernetes.io/role": role},
                created_at=datetime.utcnow()
            ),
            spec=NodeSpec(),
            status=NodeStatus(
                conditions=[
                    NodeCondition(
                        type=NodeConditionType.READY,
                        status="True",
                        reason="KubeletReady",
                        message="kubelet is posting ready status"
                    )
                ],
                capacity=NodeResources(
                    cpu_millicores=self.config.node_cpu_millicores,
                    memory_mb=self.config.node_memory_mb,
                    pods=self.config.max_pods_per_node
                ),
                allocatable=NodeResources(
                    cpu_millicores=int(self.config.node_cpu_millicores * 0.9),
                    memory_mb=int(self.config.node_memory_mb * 0.9),
                    pods=self.config.max_pods_per_node
                ),
                allocated=NodeResources(cpu_millicores=0, memory_mb=0, pods=0),
                node_info={
                    "kubeletVersion": f"v{self.config.kubernetes_version}",
                    "containerRuntimeVersion": "containerd://1.6.0",
                    "osImage": "Ubuntu 22.04 LTS",
                    "architecture": "amd64"
                }
            ),
            role=role
        )
        
        self.nodes[name] = node
        
        await self._emit_event(
            EventType.NODE_ADDED,
            f"Node {name} added to cluster",
            resource_type="Node",
            resource_name=name
        )
        
        return node
    
    async def create_pod(
        self,
        pod_create: PodCreate,
        emit_flow_events: bool = False,
        speed_multiplier: float = 1.0
    ) -> Pod:
        """
        Create a new pod with full lifecycle simulation.
        
        Args:
            pod_create: Pod creation spec
            emit_flow_events: Whether to emit detailed flow events
            speed_multiplier: Speed up/slow down the simulation
        """
        pod = Pod(
            metadata=ObjectMeta(
                name=pod_create.metadata.name,
                namespace=pod_create.metadata.namespace,
                uid=uuid4(),
                labels=pod_create.metadata.labels,
                annotations=pod_create.metadata.annotations,
                created_at=datetime.utcnow()
            ),
            spec=pod_create.spec,
            status=PodStatus(phase=PodPhase.PENDING)
        )
        
        key = f"{pod.metadata.namespace}/{pod.metadata.name}"
        self.pods[key] = pod
        
        await self._emit_event(
            EventType.POD_CREATED,
            f"Pod {pod.metadata.name} created",
            resource_type="Pod",
            resource_name=pod.metadata.name,
            resource_namespace=pod.metadata.namespace
        )
        
        # Run pod creation flow
        asyncio.create_task(
            self._run_pod_creation_flow(pod, emit_flow_events, speed_multiplier)
        )
        
        return pod
    
    async def _run_pod_creation_flow(
        self,
        pod: Pod,
        emit_flow_events: bool,
        speed_multiplier: float
    ) -> None:
        """Simulate the full pod creation flow."""
        key = f"{pod.metadata.namespace}/{pod.metadata.name}"
        
        if emit_flow_events:
            for step in POD_CREATION_FLOW_STEPS[:4]:
                await asyncio.sleep(step.duration_ms / 1000 / speed_multiplier)
                await self._emit_event(
                    step.event_type,
                    step.description,
                    resource_type="Pod",
                    resource_name=pod.metadata.name,
                    details={"step": step.step_number, "component": step.component}
                )
        
        # Schedule the pod
        worker_nodes = [n for n in self.nodes.values() if n.role == "worker"]
        result = self.scheduler.schedule(pod, worker_nodes)
        
        if not result.success:
            pod.status.phase = PodPhase.FAILED
            await self._emit_event(
                EventType.SCHEDULING_FAILED,
                f"Failed to schedule pod: {result.failure_reason}",
                resource_type="Pod",
                resource_name=pod.metadata.name,
                severity=EventSeverity.ERROR
            )
            return
        
        # Update pod with node assignment
        pod.status.node_name = result.selected_node
        pod.status.phase = PodPhase.PENDING
        
        if emit_flow_events:
            for step in POD_CREATION_FLOW_STEPS[4:8]:
                await asyncio.sleep(step.duration_ms / 1000 / speed_multiplier)
                await self._emit_event(
                    step.event_type,
                    step.description,
                    resource_type="Pod",
                    resource_name=pod.metadata.name,
                    details={
                        "step": step.step_number,
                        "component": step.component,
                        "node": result.selected_node
                    }
                )
        
        await self._emit_event(
            EventType.POD_SCHEDULED,
            f"Pod scheduled to node {result.selected_node}",
            resource_type="Pod",
            resource_name=pod.metadata.name,
            details={"node": result.selected_node}
        )
        
        # Allocate resources on node
        node = self.nodes[result.selected_node]
        pod_cpu = sum(c.resources.requests.cpu_millicores for c in pod.spec.containers)
        pod_memory = sum(c.resources.requests.memory_mb for c in pod.spec.containers)
        
        node.status.allocated.cpu_millicores += pod_cpu
        node.status.allocated.memory_mb += pod_memory
        node.status.allocated.pods += 1
        
        # Container creation phase
        pod.status.phase = PodPhase.CONTAINER_CREATING
        
        if emit_flow_events:
            for step in POD_CREATION_FLOW_STEPS[8:13]:
                await asyncio.sleep(step.duration_ms / 1000 / speed_multiplier)
                await self._emit_event(
                    step.event_type,
                    step.description,
                    resource_type="Pod",
                    resource_name=pod.metadata.name,
                    details={"step": step.step_number, "component": step.component}
                )
        else:
            await asyncio.sleep(2.0 / speed_multiplier)
        
        # Pod is now running
        pod.status.phase = PodPhase.RUNNING
        pod.status.start_time = datetime.utcnow()
        pod.status.pod_ip = f"10.244.{random.randint(1,254)}.{random.randint(1,254)}"
        pod.status.host_ip = f"192.168.1.{random.randint(10,50)}"
        
        # Set container statuses
        pod.status.container_statuses = [
            ContainerStatus(
                name=c.name,
                ready=True,
                started=True,
                state="running",
                image=c.image,
                container_id=f"containerd://{uuid4().hex[:12]}"
            )
            for c in pod.spec.containers
        ]
        
        if emit_flow_events:
            step = POD_CREATION_FLOW_STEPS[13]
            await asyncio.sleep(step.duration_ms / 1000 / speed_multiplier)
            await self._emit_event(
                step.event_type,
                step.description,
                resource_type="Pod",
                resource_name=pod.metadata.name,
                severity=EventSeverity.SUCCESS,
                details={"step": step.step_number, "pod_ip": pod.status.pod_ip}
            )
        
        await self._emit_event(
            EventType.POD_RUNNING,
            f"Pod {pod.metadata.name} is now running on {result.selected_node}",
            resource_type="Pod",
            resource_name=pod.metadata.name,
            severity=EventSeverity.SUCCESS,
            details={"node": result.selected_node, "pod_ip": pod.status.pod_ip}
        )
    
    async def delete_pod(self, namespace: str, name: str) -> bool:
        """Delete a pod."""
        key = f"{namespace}/{name}"
        pod = self.pods.get(key)
        
        if not pod:
            return False
        
        pod.status.phase = PodPhase.TERMINATING
        
        await self._emit_event(
            EventType.POD_DELETED,
            f"Pod {name} terminating",
            resource_type="Pod",
            resource_name=name,
            resource_namespace=namespace
        )
        
        # Release resources
        if pod.status.node_name and pod.status.node_name in self.nodes:
            node = self.nodes[pod.status.node_name]
            pod_cpu = sum(c.resources.requests.cpu_millicores for c in pod.spec.containers)
            pod_memory = sum(c.resources.requests.memory_mb for c in pod.spec.containers)
            
            node.status.allocated.cpu_millicores = max(0, node.status.allocated.cpu_millicores - pod_cpu)
            node.status.allocated.memory_mb = max(0, node.status.allocated.memory_mb - pod_memory)
            node.status.allocated.pods = max(0, node.status.allocated.pods - 1)
        
        # Simulate graceful termination
        await asyncio.sleep(1)
        del self.pods[key]
        
        return True
    
    async def create_deployment(self, deployment_create: DeploymentCreate) -> Deployment:
        """Create a deployment and its pods."""
        deployment = Deployment(
            metadata=ObjectMeta(
                name=deployment_create.metadata.name,
                namespace=deployment_create.metadata.namespace,
                uid=uuid4(),
                labels=deployment_create.metadata.labels,
                created_at=datetime.utcnow()
            ),
            spec=deployment_create.spec,
            status=DeploymentStatus()
        )
        
        key = f"{deployment.metadata.namespace}/{deployment.metadata.name}"
        self.deployments[key] = deployment
        
        await self._emit_event(
            EventType.DEPLOYMENT_CREATED,
            f"Deployment {deployment.metadata.name} created",
            resource_type="Deployment",
            resource_name=deployment.metadata.name
        )
        
        # Create pods for the deployment
        asyncio.create_task(self._reconcile_deployment(deployment))
        
        return deployment
    
    async def _reconcile_deployment(self, deployment: Deployment) -> None:
        """Reconcile deployment to desired state."""
        key = f"{deployment.metadata.namespace}/{deployment.metadata.name}"
        desired = deployment.spec.replicas
        
        # Find existing pods for this deployment
        deployment_pods = [
            p for p in self.pods.values()
            if p.metadata.labels.get("app") == deployment.metadata.name
        ]
        current = len(deployment_pods)
        
        if current < desired:
            # Scale up
            for i in range(desired - current):
                pod_name = f"{deployment.metadata.name}-{uuid4().hex[:8]}"
                pod_create = PodCreate(
                    metadata=ObjectMeta(
                        name=pod_name,
                        namespace=deployment.metadata.namespace,
                        labels={"app": deployment.metadata.name}
                    ),
                    spec=deployment.spec.template.spec
                )
                await self.create_pod(pod_create)
                await asyncio.sleep(0.5)
        
        elif current > desired:
            # Scale down
            pods_to_delete = deployment_pods[desired:]
            for pod in pods_to_delete:
                await self.delete_pod(pod.metadata.namespace, pod.metadata.name)
                await asyncio.sleep(0.5)
        
        # Update deployment status
        deployment.status.replicas = desired
        deployment.status.ready_replicas = len([
            p for p in self.pods.values()
            if p.metadata.labels.get("app") == deployment.metadata.name
            and p.status.phase == PodPhase.RUNNING
        ])
        deployment.status.available_replicas = deployment.status.ready_replicas
    
    async def scale_deployment(self, namespace: str, name: str, replicas: int) -> bool:
        """Scale a deployment to specified replicas."""
        key = f"{namespace}/{name}"
        deployment = self.deployments.get(key)
        
        if not deployment:
            return False
        
        old_replicas = deployment.spec.replicas
        deployment.spec.replicas = replicas
        
        await self._emit_event(
            EventType.DEPLOYMENT_SCALED,
            f"Deployment {name} scaled from {old_replicas} to {replicas}",
            resource_type="Deployment",
            resource_name=name,
            details={"old_replicas": old_replicas, "new_replicas": replicas}
        )
        
        await self._reconcile_deployment(deployment)
        return True
    
    async def create_service(self, service_create: ServiceCreate) -> Service:
        """Create a service."""
        cluster_ip = f"10.96.{random.randint(0,255)}.{random.randint(1,254)}"
        
        service = Service(
            metadata=ObjectMeta(
                name=service_create.metadata.name,
                namespace=service_create.metadata.namespace,
                uid=uuid4(),
                labels=service_create.metadata.labels,
                created_at=datetime.utcnow()
            ),
            spec=service_create.spec,
            status=ServiceStatus()
        )
        service.spec.cluster_ip = cluster_ip
        
        if service.spec.type == ServiceType.LOAD_BALANCER:
            service.status.load_balancer_ingress = [
                {"ip": f"203.0.113.{random.randint(1,254)}"}
            ]
        
        key = f"{service.metadata.namespace}/{service.metadata.name}"
        self.services[key] = service
        
        await self._emit_event(
            EventType.SERVICE_CREATED,
            f"Service {service.metadata.name} created with ClusterIP {cluster_ip}",
            resource_type="Service",
            resource_name=service.metadata.name
        )
        
        return service
    
    async def create_configmap(self, cm_create: ConfigMapCreate) -> ConfigMap:
        """Create a ConfigMap."""
        configmap = ConfigMap(
            metadata=ObjectMeta(
                name=cm_create.metadata.name,
                namespace=cm_create.metadata.namespace,
                uid=uuid4(),
                created_at=datetime.utcnow()
            ),
            data=cm_create.data
        )
        
        key = f"{configmap.metadata.namespace}/{configmap.metadata.name}"
        self.configmaps[key] = configmap
        
        await self._emit_event(
            EventType.CONFIGMAP_CREATED,
            f"ConfigMap {configmap.metadata.name} created",
            resource_type="ConfigMap",
            resource_name=configmap.metadata.name
        )
        
        return configmap
    
    async def create_secret(self, secret_create: SecretCreate) -> Secret:
        """Create a Secret."""
        secret = Secret(
            metadata=ObjectMeta(
                name=secret_create.metadata.name,
                namespace=secret_create.metadata.namespace,
                uid=uuid4(),
                created_at=datetime.utcnow()
            ),
            type=secret_create.type,
            data=secret_create.data
        )
        
        key = f"{secret.metadata.namespace}/{secret.metadata.name}"
        self.secrets[key] = secret
        
        await self._emit_event(
            EventType.SECRET_CREATED,
            f"Secret {secret.metadata.name} created",
            resource_type="Secret",
            resource_name=secret.metadata.name
        )
        
        return secret
    
    async def create_hpa(self, hpa_create: HPACreate) -> HPA:
        """Create an HPA."""
        hpa = HPA(
            metadata=ObjectMeta(
                name=hpa_create.metadata.name,
                namespace=hpa_create.metadata.namespace,
                uid=uuid4(),
                created_at=datetime.utcnow()
            ),
            spec=hpa_create.spec,
            status=HPAStatus()
        )
        
        key = f"{hpa.metadata.namespace}/{hpa.metadata.name}"
        self.hpas[key] = hpa
        
        await self._emit_event(
            EventType.HPA_CREATED,
            f"HPA {hpa.metadata.name} created targeting {hpa.spec.scale_target_ref_name}",
            resource_type="HorizontalPodAutoscaler",
            resource_name=hpa.metadata.name
        )
        
        return hpa
    
    def get_stats(self) -> ClusterStats:
        """Get cluster statistics."""
        running_pods = len([p for p in self.pods.values() if p.status.phase == PodPhase.RUNNING])
        pending_pods = len([p for p in self.pods.values() if p.status.phase == PodPhase.PENDING])
        failed_pods = len([p for p in self.pods.values() if p.status.phase == PodPhase.FAILED])
        
        total_cpu = sum(n.status.allocatable.cpu_millicores for n in self.nodes.values())
        used_cpu = sum(n.status.allocated.cpu_millicores for n in self.nodes.values())
        total_memory = sum(n.status.allocatable.memory_mb for n in self.nodes.values())
        used_memory = sum(n.status.allocated.memory_mb for n in self.nodes.values())
        
        ready_nodes = len([
            n for n in self.nodes.values()
            if any(c.type == NodeConditionType.READY and c.status == "True" for c in n.status.conditions)
        ])
        
        return ClusterStats(
            total_pods=len(self.pods),
            running_pods=running_pods,
            pending_pods=pending_pods,
            failed_pods=failed_pods,
            total_deployments=len(self.deployments),
            total_services=len(self.services),
            total_nodes=len(self.nodes),
            ready_nodes=ready_nodes,
            total_cpu_millicores=total_cpu,
            used_cpu_millicores=used_cpu,
            total_memory_mb=total_memory,
            used_memory_mb=used_memory
        )
    
    def to_cluster(self) -> Cluster:
        """Convert simulator state to Cluster schema."""
        return Cluster(
            id=self.cluster_id,
            config=self.config,
            status=self.status,
            control_plane=self.control_plane,
            nodes=list(self.nodes.values()),
            stats=self.get_stats(),
            created_at=self.created_at,
            updated_at=datetime.utcnow()
        )
    
    async def _emit_event(
        self,
        event_type: EventType,
        message: str,
        severity: EventSeverity = EventSeverity.INFO,
        resource_type: Optional[str] = None,
        resource_name: Optional[str] = None,
        resource_namespace: Optional[str] = None,
        details: Optional[dict] = None
    ) -> None:
        """Emit a cluster event."""
        event = ClusterEvent(
            id=uuid4(),
            type=event_type,
            severity=severity,
            cluster_id=self.cluster_id,
            resource_type=resource_type,
            resource_name=resource_name,
            resource_namespace=resource_namespace,
            message=message,
            details=details or {}
        )
        await event_bus.publish(event)


# Global simulator registry
_simulators: dict[UUID, ClusterSimulator] = {}


def get_simulator(cluster_id: UUID) -> Optional[ClusterSimulator]:
    """Get simulator by cluster ID."""
    return _simulators.get(cluster_id)


def register_simulator(simulator: ClusterSimulator) -> None:
    """Register a simulator."""
    _simulators[simulator.cluster_id] = simulator


def unregister_simulator(cluster_id: UUID) -> None:
    """Unregister a simulator."""
    if cluster_id in _simulators:
        del _simulators[cluster_id]


def list_simulators() -> list[ClusterSimulator]:
    """List all simulators."""
    return list(_simulators.values())
