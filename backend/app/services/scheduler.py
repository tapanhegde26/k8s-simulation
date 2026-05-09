"""Kubernetes scheduler simulation."""

import random
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app.schemas.kubernetes import Pod, Node, NodeConditionType


@dataclass
class NodeScore:
    """Scoring result for a node."""
    node_name: str
    score: int
    reasons: list[str]
    filtered_out: bool = False
    filter_reason: Optional[str] = None


@dataclass
class SchedulingResult:
    """Result of scheduling decision."""
    success: bool
    selected_node: Optional[str]
    scores: list[NodeScore]
    failure_reason: Optional[str] = None


class Scheduler:
    """
    Simulates Kubernetes scheduler behavior.
    
    Implements filtering (predicates) and scoring (priorities) phases.
    """
    
    def __init__(self):
        self.scheduling_queue: list[Pod] = []
    
    def schedule(self, pod: Pod, nodes: list[Node]) -> SchedulingResult:
        """
        Schedule a pod to a node.
        
        Args:
            pod: The pod to schedule
            nodes: Available nodes in the cluster
            
        Returns:
            SchedulingResult with selected node or failure reason
        """
        if not nodes:
            return SchedulingResult(
                success=False,
                selected_node=None,
                scores=[],
                failure_reason="No nodes available in cluster"
            )
        
        # Phase 1: Filtering
        filtered_nodes, scores = self._filter_nodes(pod, nodes)
        
        if not filtered_nodes:
            return SchedulingResult(
                success=False,
                selected_node=None,
                scores=scores,
                failure_reason="No nodes passed filtering predicates"
            )
        
        # Phase 2: Scoring
        scored_nodes = self._score_nodes(pod, filtered_nodes, scores)
        
        # Select highest scoring node (with tie-breaker)
        best_score = max(s.score for s in scored_nodes if not s.filtered_out)
        best_nodes = [s for s in scored_nodes if s.score == best_score and not s.filtered_out]
        
        # Random tie-breaker
        selected = random.choice(best_nodes)
        
        return SchedulingResult(
            success=True,
            selected_node=selected.node_name,
            scores=scored_nodes
        )
    
    def _filter_nodes(
        self, pod: Pod, nodes: list[Node]
    ) -> tuple[list[Node], list[NodeScore]]:
        """
        Filter nodes based on predicates.
        
        Predicates:
        - Node is Ready
        - Node is not cordoned/unschedulable
        - Node has sufficient resources
        - Node selector matches (if specified)
        """
        filtered = []
        scores = []
        
        # Calculate pod resource requirements
        pod_cpu = sum(c.resources.requests.cpu_millicores for c in pod.spec.containers)
        pod_memory = sum(c.resources.requests.memory_mb for c in pod.spec.containers)
        
        for node in nodes:
            score = NodeScore(node_name=node.metadata.name, score=0, reasons=[])
            
            # Check if node is ready
            is_ready = any(
                c.type == NodeConditionType.READY and c.status == "True"
                for c in node.status.conditions
            )
            if not is_ready:
                score.filtered_out = True
                score.filter_reason = "Node is not Ready"
                scores.append(score)
                continue
            
            # Check if node is schedulable
            if node.spec.unschedulable:
                score.filtered_out = True
                score.filter_reason = "Node is cordoned (unschedulable)"
                scores.append(score)
                continue
            
            # Check resource availability
            available_cpu = node.status.allocatable.cpu_millicores - node.status.allocated.cpu_millicores
            available_memory = node.status.allocatable.memory_mb - node.status.allocated.memory_mb
            
            if pod_cpu > available_cpu:
                score.filtered_out = True
                score.filter_reason = f"Insufficient CPU: need {pod_cpu}m, available {available_cpu}m"
                scores.append(score)
                continue
            
            if pod_memory > available_memory:
                score.filtered_out = True
                score.filter_reason = f"Insufficient memory: need {pod_memory}MB, available {available_memory}MB"
                scores.append(score)
                continue
            
            # Check pod count limit
            if node.status.allocated.pods >= node.status.allocatable.pods:
                score.filtered_out = True
                score.filter_reason = f"Max pods reached: {node.status.allocatable.pods}"
                scores.append(score)
                continue
            
            # Check node selector
            if pod.spec.node_selector:
                node_labels = node.metadata.labels
                selector_match = all(
                    node_labels.get(k) == v
                    for k, v in pod.spec.node_selector.items()
                )
                if not selector_match:
                    score.filtered_out = True
                    score.filter_reason = "Node selector does not match"
                    scores.append(score)
                    continue
            
            # Node passed all filters
            filtered.append(node)
            scores.append(score)
        
        return filtered, scores
    
    def _score_nodes(
        self, pod: Pod, nodes: list[Node], scores: list[NodeScore]
    ) -> list[NodeScore]:
        """
        Score filtered nodes based on priorities.
        
        Priorities:
        - LeastRequestedPriority: Prefer nodes with more available resources
        - BalancedResourceAllocation: Prefer balanced CPU/memory usage
        - ImageLocalityPriority: Prefer nodes that already have the image (simulated)
        """
        # Create a map for quick lookup
        score_map = {s.node_name: s for s in scores}
        
        pod_cpu = sum(c.resources.requests.cpu_millicores for c in pod.spec.containers)
        pod_memory = sum(c.resources.requests.memory_mb for c in pod.spec.containers)
        
        for node in nodes:
            score = score_map[node.metadata.name]
            
            # LeastRequestedPriority (0-10 points)
            cpu_fraction = node.status.allocated.cpu_millicores / node.status.allocatable.cpu_millicores
            memory_fraction = node.status.allocated.memory_mb / node.status.allocatable.memory_mb
            
            least_requested_score = int((1 - (cpu_fraction + memory_fraction) / 2) * 10)
            score.score += least_requested_score
            score.reasons.append(f"LeastRequested: +{least_requested_score}")
            
            # BalancedResourceAllocation (0-10 points)
            # Prefer nodes where CPU and memory usage are balanced
            balance_diff = abs(cpu_fraction - memory_fraction)
            balance_score = int((1 - balance_diff) * 10)
            score.score += balance_score
            score.reasons.append(f"BalancedAllocation: +{balance_score}")
            
            # ImageLocalityPriority (0-5 points, simulated)
            # In real K8s, this checks if the image is already on the node
            image_score = random.randint(0, 5)
            score.score += image_score
            score.reasons.append(f"ImageLocality: +{image_score}")
            
            # NodeAffinityPriority (0-5 points)
            # Bonus for nodes with preferred labels
            if node.metadata.labels:
                affinity_score = min(len(node.metadata.labels), 5)
                score.score += affinity_score
                score.reasons.append(f"NodeAffinity: +{affinity_score}")
        
        return scores
    
    def get_scheduling_explanation(self, result: SchedulingResult) -> str:
        """Generate human-readable explanation of scheduling decision."""
        lines = []
        
        if result.success:
            lines.append(f"✓ Pod scheduled to node: {result.selected_node}")
            lines.append("\nNode Scores:")
        else:
            lines.append(f"✗ Scheduling failed: {result.failure_reason}")
            lines.append("\nNode Analysis:")
        
        for score in sorted(result.scores, key=lambda s: s.score, reverse=True):
            if score.filtered_out:
                lines.append(f"  {score.node_name}: FILTERED - {score.filter_reason}")
            else:
                lines.append(f"  {score.node_name}: Score {score.score}")
                for reason in score.reasons:
                    lines.append(f"    - {reason}")
        
        return "\n".join(lines)
