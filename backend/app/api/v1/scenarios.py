"""Learning scenarios API endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from app.schemas.scenarios import (
    Scenario, ScenarioCreate, ScenarioSummary, ScenarioProgress,
    Difficulty, BUILTIN_SCENARIOS
)
from app.services.simulator import get_simulator

router = APIRouter()

# In-memory storage for scenarios and progress
_scenarios: dict[UUID, Scenario] = {}
_progress: dict[str, ScenarioProgress] = {}  # key: f"{cluster_id}/{scenario_id}"


def _init_builtin_scenarios():
    """Initialize built-in scenarios."""
    for scenario_data in BUILTIN_SCENARIOS:
        scenario_id = uuid4()
        scenario = Scenario(
            id=scenario_id,
            title=scenario_data["title"],
            description=scenario_data["description"],
            difficulty=scenario_data["difficulty"],
            estimated_minutes=scenario_data["estimated_minutes"],
            concepts=scenario_data["concepts"],
            objectives=[
                {**obj, "completed": False}
                for obj in scenario_data["objectives"]
            ],
            hints=[
                {**hint, "revealed": False}
                for hint in scenario_data.get("hints", [])
            ],
            story=scenario_data.get("story"),
            initial_state={},
            created_at=datetime.utcnow()
        )
        _scenarios[scenario_id] = scenario


# Initialize on module load
_init_builtin_scenarios()


@router.get("/scenarios", response_model=list[ScenarioSummary])
async def list_scenarios(
    difficulty: Optional[Difficulty] = None,
    concept: Optional[str] = None
):
    """List all available scenarios."""
    scenarios = list(_scenarios.values())
    
    if difficulty:
        scenarios = [s for s in scenarios if s.difficulty == difficulty]
    
    if concept:
        scenarios = [s for s in scenarios if concept.lower() in [c.lower() for c in s.concepts]]
    
    return [
        ScenarioSummary(
            id=s.id,
            title=s.title,
            description=s.description,
            difficulty=s.difficulty,
            estimated_minutes=s.estimated_minutes,
            concepts=s.concepts,
            objectives_count=len(s.objectives)
        )
        for s in scenarios
    ]


@router.get("/scenarios/{scenario_id}", response_model=Scenario)
async def get_scenario(scenario_id: UUID):
    """Get scenario details."""
    scenario = _scenarios.get(scenario_id)
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found"
        )
    
    return scenario


@router.post("/clusters/{cluster_id}/scenarios/{scenario_id}/start", response_model=ScenarioProgress)
async def start_scenario(cluster_id: UUID, scenario_id: UUID):
    """Start a scenario on a cluster."""
    simulator = get_simulator(cluster_id)
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    scenario = _scenarios.get(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found"
        )
    
    # Create progress tracker
    progress_key = f"{cluster_id}/{scenario_id}"
    progress = ScenarioProgress(
        scenario_id=scenario_id,
        cluster_id=cluster_id,
        started_at=datetime.utcnow()
    )
    _progress[progress_key] = progress
    
    # Reset cluster for clean scenario start
    simulator.pods.clear()
    simulator.deployments.clear()
    simulator.services.clear()
    simulator.configmaps.clear()
    simulator.secrets.clear()
    simulator.hpas.clear()
    
    for node in simulator.nodes.values():
        node.status.allocated.cpu_millicores = 0
        node.status.allocated.memory_mb = 0
        node.status.allocated.pods = 0
    
    return progress


@router.get("/clusters/{cluster_id}/scenarios/{scenario_id}/progress", response_model=ScenarioProgress)
async def get_scenario_progress(cluster_id: UUID, scenario_id: UUID):
    """Get progress for a scenario."""
    progress_key = f"{cluster_id}/{scenario_id}"
    progress = _progress.get(progress_key)
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not started on this cluster"
        )
    
    # Update elapsed time
    progress.elapsed_seconds = int((datetime.utcnow() - progress.started_at).total_seconds())
    
    return progress


@router.post("/clusters/{cluster_id}/scenarios/{scenario_id}/validate")
async def validate_scenario(cluster_id: UUID, scenario_id: UUID):
    """Validate scenario objectives against current cluster state."""
    simulator = get_simulator(cluster_id)
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found"
        )
    
    scenario = _scenarios.get(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found"
        )
    
    progress_key = f"{cluster_id}/{scenario_id}"
    progress = _progress.get(progress_key)
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scenario not started"
        )
    
    results = []
    all_completed = True
    
    for objective in scenario.objectives:
        completed = _check_objective(simulator, objective)
        
        if completed and objective["id"] not in progress.objectives_completed:
            progress.objectives_completed.append(objective["id"])
        
        if not completed:
            all_completed = False
        
        results.append({
            "id": objective["id"],
            "title": objective["title"],
            "completed": completed
        })
    
    if all_completed and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
    
    progress.elapsed_seconds = int((datetime.utcnow() - progress.started_at).total_seconds())
    
    return {
        "objectives": results,
        "all_completed": all_completed,
        "progress": progress
    }


def _check_objective(simulator, objective: dict) -> bool:
    """Check if an objective is completed."""
    obj_type = objective.get("type")
    target = objective.get("target", {})
    
    if obj_type == "create_resource":
        kind = target.get("kind")
        name = target.get("name")
        namespace = target.get("namespace", "default")
        
        if kind == "Pod":
            key = f"{namespace}/{name}"
            return key in simulator.pods
        
        elif kind == "Deployment":
            key = f"{namespace}/{name}"
            if key not in simulator.deployments:
                return False
            deployment = simulator.deployments[key]
            if "replicas" in target:
                return deployment.spec.replicas >= target["replicas"]
            return True
        
        elif kind == "Service":
            key = f"{namespace}/{name}"
            return key in simulator.services
        
        elif kind == "ConfigMap":
            key = f"{namespace}/{name}"
            return key in simulator.configmaps
        
        elif kind == "Secret":
            key = f"{namespace}/{name}"
            return key in simulator.secrets
        
        elif kind == "HorizontalPodAutoscaler":
            key = f"{namespace}/{name}"
            return key in simulator.hpas
    
    elif obj_type == "scale_deployment":
        name = target.get("name")
        namespace = target.get("namespace", "default")
        replicas = target.get("replicas")
        
        key = f"{namespace}/{name}"
        if key not in simulator.deployments:
            return False
        
        deployment = simulator.deployments[key]
        return deployment.spec.replicas == replicas
    
    elif obj_type == "wait_for_condition":
        kind = target.get("kind")
        name = target.get("name")
        namespace = target.get("namespace", "default")
        condition = target.get("condition")
        
        if kind == "Pod":
            key = f"{namespace}/{name}"
            pod = simulator.pods.get(key)
            if not pod:
                return False
            if condition == "Running":
                return pod.status.phase.value == "Running"
        
        elif kind == "Deployment":
            key = f"{namespace}/{name}"
            deployment = simulator.deployments.get(key)
            if not deployment:
                return False
            
            if "minReplicas" in target:
                return deployment.status.ready_replicas >= target["minReplicas"]
    
    return False


@router.post("/clusters/{cluster_id}/scenarios/{scenario_id}/hint/{hint_id}")
async def reveal_hint(cluster_id: UUID, scenario_id: UUID, hint_id: str):
    """Reveal a hint for a scenario."""
    progress_key = f"{cluster_id}/{scenario_id}"
    progress = _progress.get(progress_key)
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scenario not started"
        )
    
    scenario = _scenarios.get(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found"
        )
    
    hint = next((h for h in scenario.hints if h.id == hint_id), None)
    if not hint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hint {hint_id} not found"
        )
    
    if hint_id not in progress.hints_revealed:
        progress.hints_revealed.append(hint_id)
    
    return {"hint": hint.text}
