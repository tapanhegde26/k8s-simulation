"""Cluster management API endpoints."""

from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from app.schemas.cluster import (
    Cluster, ClusterCreate, ClusterConfig, ClusterSummary, ClusterStatus
)
from app.services.simulator import (
    ClusterSimulator, get_simulator, register_simulator,
    unregister_simulator, list_simulators
)

router = APIRouter()


@router.post("/clusters", response_model=Cluster, status_code=status.HTTP_201_CREATED)
async def create_cluster(cluster_create: ClusterCreate = None):
    """
    Create a new simulated Kubernetes cluster.
    
    If no configuration is provided, defaults will be used.
    """
    config = cluster_create.config if cluster_create else ClusterConfig()
    cluster_id = uuid4()
    
    simulator = ClusterSimulator(cluster_id, config)
    register_simulator(simulator)
    
    await simulator.initialize()
    
    return simulator.to_cluster()


@router.get("/clusters", response_model=list[ClusterSummary])
async def list_clusters():
    """List all simulated clusters."""
    simulators = list_simulators()
    
    return [
        ClusterSummary(
            id=sim.cluster_id,
            name=sim.config.name,
            status=sim.status,
            kubernetes_version=sim.config.kubernetes_version,
            node_count=len(sim.nodes),
            pod_count=len(sim.pods),
            created_at=sim.created_at
        )
        for sim in simulators
    ]


@router.get("/clusters/{cluster_id}", response_model=Cluster)
async def get_cluster(cluster_id: UUID):
    """Get cluster details by ID."""
    simulator = get_simulator(cluster_id)
    
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    return simulator.to_cluster()


@router.delete("/clusters/{cluster_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cluster(cluster_id: UUID):
    """Delete a simulated cluster."""
    simulator = get_simulator(cluster_id)
    
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    simulator.status = ClusterStatus.DELETING
    unregister_simulator(cluster_id)


@router.post("/clusters/{cluster_id}/nodes")
async def add_node(cluster_id: UUID, name: Optional[str] = None):
    """Add a worker node to the cluster."""
    simulator = get_simulator(cluster_id)
    
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    worker_count = len([n for n in simulator.nodes.values() if n.role == "worker"])
    node_name = name or f"worker-{worker_count + 1}"
    
    node = await simulator._create_node(node_name, role="worker")
    return node


@router.delete("/clusters/{cluster_id}/nodes/{node_name}")
async def remove_node(cluster_id: UUID, node_name: str):
    """Remove a node from the cluster."""
    simulator = get_simulator(cluster_id)
    
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    if node_name not in simulator.nodes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node {node_name} not found"
        )
    
    node = simulator.nodes[node_name]
    if node.role == "master":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove master node"
        )
    
    # Evict pods from the node
    pods_to_evict = [
        p for p in simulator.pods.values()
        if p.status.node_name == node_name
    ]
    
    for pod in pods_to_evict:
        await simulator.delete_pod(pod.metadata.namespace, pod.metadata.name)
    
    del simulator.nodes[node_name]
    
    return {"message": f"Node {node_name} removed, {len(pods_to_evict)} pods evicted"}


@router.post("/clusters/{cluster_id}/reset")
async def reset_cluster(cluster_id: UUID):
    """Reset cluster to initial state."""
    simulator = get_simulator(cluster_id)
    
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    # Clear all resources except nodes
    simulator.pods.clear()
    simulator.deployments.clear()
    simulator.services.clear()
    simulator.ingresses.clear()
    simulator.configmaps.clear()
    simulator.secrets.clear()
    simulator.hpas.clear()
    
    # Reset node allocations
    for node in simulator.nodes.values():
        node.status.allocated.cpu_millicores = 0
        node.status.allocated.memory_mb = 0
        node.status.allocated.pods = 0
    
    return {"message": "Cluster reset to initial state"}
