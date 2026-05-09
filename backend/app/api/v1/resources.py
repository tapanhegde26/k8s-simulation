"""Kubernetes resource management API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.kubernetes import (
    Pod, PodCreate, PodPhase,
    Deployment, DeploymentCreate,
    Service, ServiceCreate,
    Ingress, IngressCreate,
    ConfigMap, ConfigMapCreate,
    Secret, SecretCreate,
    HPA, HPACreate,
    ObjectMeta, PodSpec, Container, LabelSelector, DeploymentSpec,
    ServiceSpec, ServicePort, ServiceType
)
from app.services.simulator import get_simulator

router = APIRouter()


def _get_simulator_or_404(cluster_id: UUID):
    """Get simulator or raise 404."""
    simulator = get_simulator(cluster_id)
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    return simulator


# ============================================================================
# Pods
# ============================================================================

@router.get("/clusters/{cluster_id}/pods", response_model=list[Pod])
async def list_pods(
    cluster_id: UUID,
    namespace: Optional[str] = Query(None, description="Filter by namespace")
):
    """List all pods in the cluster."""
    simulator = _get_simulator_or_404(cluster_id)
    
    pods = list(simulator.pods.values())
    if namespace:
        pods = [p for p in pods if p.metadata.namespace == namespace]
    
    return pods


@router.get("/clusters/{cluster_id}/namespaces/{namespace}/pods/{name}", response_model=Pod)
async def get_pod(cluster_id: UUID, namespace: str, name: str):
    """Get a specific pod."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    pod = simulator.pods.get(key)
    
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pod {name} not found in namespace {namespace}"
        )
    
    return pod


@router.post("/clusters/{cluster_id}/pods", response_model=Pod, status_code=status.HTTP_201_CREATED)
async def create_pod(
    cluster_id: UUID,
    pod_create: PodCreate,
    emit_flow_events: bool = Query(False, description="Emit detailed pod creation flow events"),
    speed: float = Query(1.0, ge=0.1, le=10.0, description="Simulation speed multiplier")
):
    """Create a new pod."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{pod_create.metadata.namespace}/{pod_create.metadata.name}"
    if key in simulator.pods:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Pod {pod_create.metadata.name} already exists in namespace {pod_create.metadata.namespace}"
        )
    
    pod = await simulator.create_pod(pod_create, emit_flow_events, speed)
    return pod


@router.delete("/clusters/{cluster_id}/namespaces/{namespace}/pods/{name}")
async def delete_pod(cluster_id: UUID, namespace: str, name: str):
    """Delete a pod."""
    simulator = _get_simulator_or_404(cluster_id)
    
    success = await simulator.delete_pod(namespace, name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pod {name} not found in namespace {namespace}"
        )
    
    return {"message": f"Pod {name} deleted"}


# ============================================================================
# Deployments
# ============================================================================

@router.get("/clusters/{cluster_id}/deployments", response_model=list[Deployment])
async def list_deployments(
    cluster_id: UUID,
    namespace: Optional[str] = Query(None)
):
    """List all deployments."""
    simulator = _get_simulator_or_404(cluster_id)
    
    deployments = list(simulator.deployments.values())
    if namespace:
        deployments = [d for d in deployments if d.metadata.namespace == namespace]
    
    return deployments


@router.post("/clusters/{cluster_id}/deployments", response_model=Deployment, status_code=status.HTTP_201_CREATED)
async def create_deployment(cluster_id: UUID, deployment_create: DeploymentCreate):
    """Create a new deployment."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{deployment_create.metadata.namespace}/{deployment_create.metadata.name}"
    if key in simulator.deployments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Deployment {deployment_create.metadata.name} already exists"
        )
    
    deployment = await simulator.create_deployment(deployment_create)
    return deployment


@router.patch("/clusters/{cluster_id}/namespaces/{namespace}/deployments/{name}/scale")
async def scale_deployment(
    cluster_id: UUID,
    namespace: str,
    name: str,
    replicas: int = Query(..., ge=0, le=100)
):
    """Scale a deployment."""
    simulator = _get_simulator_or_404(cluster_id)
    
    success = await simulator.scale_deployment(namespace, name, replicas)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deployment {name} not found"
        )
    
    return {"message": f"Deployment {name} scaled to {replicas} replicas"}


@router.delete("/clusters/{cluster_id}/namespaces/{namespace}/deployments/{name}")
async def delete_deployment(cluster_id: UUID, namespace: str, name: str):
    """Delete a deployment and its pods."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    if key not in simulator.deployments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deployment {name} not found"
        )
    
    deployment = simulator.deployments[key]
    
    # Delete associated pods
    pods_to_delete = [
        p for p in simulator.pods.values()
        if p.metadata.labels.get("app") == name
    ]
    for pod in pods_to_delete:
        await simulator.delete_pod(pod.metadata.namespace, pod.metadata.name)
    
    del simulator.deployments[key]
    
    return {"message": f"Deployment {name} deleted with {len(pods_to_delete)} pods"}


# ============================================================================
# Services
# ============================================================================

@router.get("/clusters/{cluster_id}/services", response_model=list[Service])
async def list_services(cluster_id: UUID, namespace: Optional[str] = Query(None)):
    """List all services."""
    simulator = _get_simulator_or_404(cluster_id)
    
    services = list(simulator.services.values())
    if namespace:
        services = [s for s in services if s.metadata.namespace == namespace]
    
    return services


@router.post("/clusters/{cluster_id}/services", response_model=Service, status_code=status.HTTP_201_CREATED)
async def create_service(cluster_id: UUID, service_create: ServiceCreate):
    """Create a new service."""
    simulator = _get_simulator_or_404(cluster_id)
    
    service = await simulator.create_service(service_create)
    return service


@router.delete("/clusters/{cluster_id}/namespaces/{namespace}/services/{name}")
async def delete_service(cluster_id: UUID, namespace: str, name: str):
    """Delete a service."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    if key not in simulator.services:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {name} not found"
        )
    
    del simulator.services[key]
    return {"message": f"Service {name} deleted"}


# ============================================================================
# ConfigMaps
# ============================================================================

@router.get("/clusters/{cluster_id}/configmaps", response_model=list[ConfigMap])
async def list_configmaps(cluster_id: UUID, namespace: Optional[str] = Query(None)):
    """List all ConfigMaps."""
    simulator = _get_simulator_or_404(cluster_id)
    
    configmaps = list(simulator.configmaps.values())
    if namespace:
        configmaps = [c for c in configmaps if c.metadata.namespace == namespace]
    
    return configmaps


@router.post("/clusters/{cluster_id}/configmaps", response_model=ConfigMap, status_code=status.HTTP_201_CREATED)
async def create_configmap(cluster_id: UUID, cm_create: ConfigMapCreate):
    """Create a new ConfigMap."""
    simulator = _get_simulator_or_404(cluster_id)
    
    configmap = await simulator.create_configmap(cm_create)
    return configmap


@router.delete("/clusters/{cluster_id}/namespaces/{namespace}/configmaps/{name}")
async def delete_configmap(cluster_id: UUID, namespace: str, name: str):
    """Delete a ConfigMap."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    if key not in simulator.configmaps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ConfigMap {name} not found"
        )
    
    del simulator.configmaps[key]
    return {"message": f"ConfigMap {name} deleted"}


# ============================================================================
# Secrets
# ============================================================================

@router.get("/clusters/{cluster_id}/secrets", response_model=list[Secret])
async def list_secrets(cluster_id: UUID, namespace: Optional[str] = Query(None)):
    """List all Secrets."""
    simulator = _get_simulator_or_404(cluster_id)
    
    secrets = list(simulator.secrets.values())
    if namespace:
        secrets = [s for s in secrets if s.metadata.namespace == namespace]
    
    return secrets


@router.post("/clusters/{cluster_id}/secrets", response_model=Secret, status_code=status.HTTP_201_CREATED)
async def create_secret(cluster_id: UUID, secret_create: SecretCreate):
    """Create a new Secret."""
    simulator = _get_simulator_or_404(cluster_id)
    
    secret = await simulator.create_secret(secret_create)
    return secret


@router.delete("/clusters/{cluster_id}/namespaces/{namespace}/secrets/{name}")
async def delete_secret(cluster_id: UUID, namespace: str, name: str):
    """Delete a Secret."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    if key not in simulator.secrets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret {name} not found"
        )
    
    del simulator.secrets[key]
    return {"message": f"Secret {name} deleted"}


# ============================================================================
# HPAs
# ============================================================================

@router.get("/clusters/{cluster_id}/hpas", response_model=list[HPA])
async def list_hpas(cluster_id: UUID, namespace: Optional[str] = Query(None)):
    """List all HPAs."""
    simulator = _get_simulator_or_404(cluster_id)
    
    hpas = list(simulator.hpas.values())
    if namespace:
        hpas = [h for h in hpas if h.metadata.namespace == namespace]
    
    return hpas


@router.post("/clusters/{cluster_id}/hpas", response_model=HPA, status_code=status.HTTP_201_CREATED)
async def create_hpa(cluster_id: UUID, hpa_create: HPACreate):
    """Create a new HPA."""
    simulator = _get_simulator_or_404(cluster_id)
    
    # Verify target deployment exists
    target_key = f"{hpa_create.metadata.namespace}/{hpa_create.spec.scale_target_ref_name}"
    if target_key not in simulator.deployments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target deployment {hpa_create.spec.scale_target_ref_name} not found"
        )
    
    hpa = await simulator.create_hpa(hpa_create)
    return hpa


@router.post("/clusters/{cluster_id}/namespaces/{namespace}/hpas/{name}/simulate-load")
async def simulate_hpa_load(
    cluster_id: UUID,
    namespace: str,
    name: str,
    cpu_percentage: float = Query(..., ge=0, le=100)
):
    """Simulate CPU load for HPA testing."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    hpa = simulator.hpas.get(key)
    
    if not hpa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HPA {name} not found"
        )
    
    # Set simulated load
    simulator.hpa_controller.set_simulated_load(
        hpa.spec.scale_target_ref_name,
        cpu_percentage
    )
    
    # Get target deployment
    deployment_key = f"{namespace}/{hpa.spec.scale_target_ref_name}"
    deployment = simulator.deployments.get(deployment_key)
    
    if deployment:
        status_info = simulator.hpa_controller.get_hpa_status(hpa, deployment)
        
        # Check if scaling is needed
        desired = status_info["desired_replicas"]
        current = status_info["current_replicas"]
        
        if desired != current:
            should_scale, reason = simulator.hpa_controller.should_scale(hpa, deployment, desired)
            if should_scale:
                await simulator.scale_deployment(namespace, hpa.spec.scale_target_ref_name, desired)
                simulator.hpa_controller.record_scale_event(hpa.spec.scale_target_ref_name)
                status_info["scaled"] = True
                status_info["scale_reason"] = reason
        
        return status_info
    
    return {"message": f"Load set to {cpu_percentage}%"}


@router.delete("/clusters/{cluster_id}/namespaces/{namespace}/hpas/{name}")
async def delete_hpa(cluster_id: UUID, namespace: str, name: str):
    """Delete an HPA."""
    simulator = _get_simulator_or_404(cluster_id)
    
    key = f"{namespace}/{name}"
    if key not in simulator.hpas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HPA {name} not found"
        )
    
    del simulator.hpas[key]
    return {"message": f"HPA {name} deleted"}


# ============================================================================
# Quick Actions (convenience endpoints)
# ============================================================================

@router.post("/clusters/{cluster_id}/quick/nginx")
async def quick_deploy_nginx(
    cluster_id: UUID,
    replicas: int = Query(3, ge=1, le=10),
    with_service: bool = Query(True)
):
    """Quick action: Deploy nginx with optional service."""
    simulator = _get_simulator_or_404(cluster_id)
    
    # Create deployment
    deployment_create = DeploymentCreate(
        metadata=ObjectMeta(name="nginx", namespace="default", labels={"app": "nginx"}),
        spec=DeploymentSpec(
            replicas=replicas,
            selector=LabelSelector(match_labels={"app": "nginx"}),
            template=PodCreate(
                metadata=ObjectMeta(name="nginx", namespace="default", labels={"app": "nginx"}),
                spec=PodSpec(containers=[
                    Container(name="nginx", image="nginx:latest")
                ])
            )
        )
    )
    
    deployment = await simulator.create_deployment(deployment_create)
    result = {"deployment": deployment}
    
    if with_service:
        service_create = ServiceCreate(
            metadata=ObjectMeta(name="nginx-service", namespace="default"),
            spec=ServiceSpec(
                type=ServiceType.CLUSTER_IP,
                selector={"app": "nginx"},
                ports=[ServicePort(port=80, target_port=80)]
            )
        )
        service = await simulator.create_service(service_create)
        result["service"] = service
    
    return result


@router.post("/clusters/{cluster_id}/quick/full-stack")
async def quick_full_stack(cluster_id: UUID):
    """Quick action: Deploy a full stack (deployment + service + configmap + secret)."""
    simulator = _get_simulator_or_404(cluster_id)
    
    # ConfigMap
    cm = await simulator.create_configmap(ConfigMapCreate(
        metadata=ObjectMeta(name="app-config", namespace="default"),
        data={"APP_ENV": "production", "LOG_LEVEL": "info"}
    ))
    
    # Secret
    secret = await simulator.create_secret(SecretCreate(
        metadata=ObjectMeta(name="app-secrets", namespace="default"),
        data={"DB_PASSWORD": "c2VjcmV0"}  # base64 encoded
    ))
    
    # Deployment
    deployment = await simulator.create_deployment(DeploymentCreate(
        metadata=ObjectMeta(name="web-app", namespace="default", labels={"app": "web-app"}),
        spec=DeploymentSpec(
            replicas=3,
            selector=LabelSelector(match_labels={"app": "web-app"}),
            template=PodCreate(
                metadata=ObjectMeta(name="web-app", namespace="default", labels={"app": "web-app"}),
                spec=PodSpec(containers=[
                    Container(name="web", image="node:18-alpine")
                ])
            )
        )
    ))
    
    # Service
    service = await simulator.create_service(ServiceCreate(
        metadata=ObjectMeta(name="web-app-service", namespace="default"),
        spec=ServiceSpec(
            type=ServiceType.LOAD_BALANCER,
            selector={"app": "web-app"},
            ports=[ServicePort(port=80, target_port=3000)]
        )
    ))
    
    return {
        "configmap": cm,
        "secret": secret,
        "deployment": deployment,
        "service": service
    }
