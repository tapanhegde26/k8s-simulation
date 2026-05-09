"""HPA (Horizontal Pod Autoscaler) simulation."""

import asyncio
import math
import random
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from app.schemas.kubernetes import HPA, Deployment


class HPAController:
    """
    Simulates Kubernetes Horizontal Pod Autoscaler behavior.
    
    Monitors deployments and scales based on CPU/memory metrics.
    """
    
    def __init__(self):
        self.simulated_metrics: dict[str, float] = {}  # deployment_name -> CPU percentage
        self.last_scale_time: dict[str, datetime] = {}
        self.scale_down_delay = timedelta(seconds=30)  # Cooldown period
        self.scale_up_delay = timedelta(seconds=15)
    
    def set_simulated_load(self, deployment_name: str, cpu_percentage: float) -> None:
        """Set simulated CPU load for a deployment."""
        self.simulated_metrics[deployment_name] = max(0, min(100, cpu_percentage))
    
    def get_current_metric(self, deployment_name: str) -> float:
        """Get current CPU metric for a deployment."""
        # Add some random variation to make it realistic
        base = self.simulated_metrics.get(deployment_name, 30.0)
        variation = random.uniform(-5, 5)
        return max(0, min(100, base + variation))
    
    def calculate_desired_replicas(
        self,
        hpa: HPA,
        deployment: Deployment,
        current_metric: Optional[float] = None
    ) -> tuple[int, str]:
        """
        Calculate desired replica count based on HPA spec.
        
        Formula: desiredReplicas = ceil(currentReplicas * (currentMetric / targetMetric))
        
        Returns:
            Tuple of (desired_replicas, reason)
        """
        current_replicas = deployment.status.ready_replicas or deployment.spec.replicas
        
        if current_replicas == 0:
            return hpa.spec.min_replicas, "No running replicas, scaling to minimum"
        
        # Get target metric from HPA spec
        target_metric = 80  # Default
        for metric in hpa.spec.metrics:
            if metric.resource_name == "cpu":
                target_metric = metric.target_value
                break
        
        # Get current metric
        if current_metric is None:
            current_metric = self.get_current_metric(hpa.spec.scale_target_ref_name)
        
        # Calculate desired replicas
        ratio = current_metric / target_metric
        desired = math.ceil(current_replicas * ratio)
        
        # Apply min/max bounds
        desired = max(hpa.spec.min_replicas, min(hpa.spec.max_replicas, desired))
        
        # Generate reason
        if desired > current_replicas:
            reason = f"CPU at {current_metric:.1f}% (target: {target_metric}%), scaling up"
        elif desired < current_replicas:
            reason = f"CPU at {current_metric:.1f}% (target: {target_metric}%), scaling down"
        else:
            reason = f"CPU at {current_metric:.1f}% (target: {target_metric}%), no change needed"
        
        return desired, reason
    
    def should_scale(
        self,
        hpa: HPA,
        deployment: Deployment,
        desired_replicas: int
    ) -> tuple[bool, str]:
        """
        Determine if scaling should occur based on cooldown periods.
        
        Returns:
            Tuple of (should_scale, reason)
        """
        current_replicas = deployment.status.ready_replicas or deployment.spec.replicas
        
        if desired_replicas == current_replicas:
            return False, "No scaling needed"
        
        deployment_name = deployment.metadata.name
        last_scale = self.last_scale_time.get(deployment_name)
        now = datetime.utcnow()
        
        if last_scale:
            if desired_replicas > current_replicas:
                # Scale up - shorter cooldown
                if now - last_scale < self.scale_up_delay:
                    remaining = (self.scale_up_delay - (now - last_scale)).seconds
                    return False, f"Scale-up cooldown: {remaining}s remaining"
            else:
                # Scale down - longer cooldown to prevent flapping
                if now - last_scale < self.scale_down_delay:
                    remaining = (self.scale_down_delay - (now - last_scale)).seconds
                    return False, f"Scale-down cooldown: {remaining}s remaining"
        
        return True, "Scaling approved"
    
    def record_scale_event(self, deployment_name: str) -> None:
        """Record that a scaling event occurred."""
        self.last_scale_time[deployment_name] = datetime.utcnow()
    
    def get_hpa_status(self, hpa: HPA, deployment: Deployment) -> dict:
        """Get current HPA status information."""
        current_metric = self.get_current_metric(hpa.spec.scale_target_ref_name)
        desired, reason = self.calculate_desired_replicas(hpa, deployment, current_metric)
        
        return {
            "current_replicas": deployment.status.ready_replicas or deployment.spec.replicas,
            "desired_replicas": desired,
            "current_cpu_percentage": round(current_metric, 1),
            "target_cpu_percentage": hpa.spec.metrics[0].target_value if hpa.spec.metrics else 80,
            "min_replicas": hpa.spec.min_replicas,
            "max_replicas": hpa.spec.max_replicas,
            "reason": reason,
            "last_scale_time": self.last_scale_time.get(deployment.metadata.name),
        }


class ClusterAutoscaler:
    """
    Simulates Kubernetes Cluster Autoscaler behavior.
    
    Adds/removes nodes based on pending pods and resource utilization.
    """
    
    def __init__(
        self,
        min_nodes: int = 1,
        max_nodes: int = 10,
        scale_down_utilization_threshold: float = 0.5,
        scale_down_delay_seconds: int = 300
    ):
        self.min_nodes = min_nodes
        self.max_nodes = max_nodes
        self.scale_down_utilization_threshold = scale_down_utilization_threshold
        self.scale_down_delay = timedelta(seconds=scale_down_delay_seconds)
        self.node_idle_since: dict[str, datetime] = {}
    
    def should_scale_up(self, pending_pods: int, current_nodes: int) -> tuple[bool, int, str]:
        """
        Determine if cluster should scale up.
        
        Returns:
            Tuple of (should_scale, nodes_to_add, reason)
        """
        if pending_pods == 0:
            return False, 0, "No pending pods"
        
        if current_nodes >= self.max_nodes:
            return False, 0, f"Already at max nodes ({self.max_nodes})"
        
        # Simple heuristic: add 1 node per 10 pending pods
        nodes_needed = math.ceil(pending_pods / 10)
        nodes_to_add = min(nodes_needed, self.max_nodes - current_nodes)
        
        return True, nodes_to_add, f"{pending_pods} pods pending, adding {nodes_to_add} node(s)"
    
    def should_scale_down(
        self,
        node_name: str,
        cpu_utilization: float,
        memory_utilization: float,
        current_nodes: int
    ) -> tuple[bool, str]:
        """
        Determine if a specific node should be removed.
        
        Returns:
            Tuple of (should_remove, reason)
        """
        if current_nodes <= self.min_nodes:
            return False, f"Already at min nodes ({self.min_nodes})"
        
        avg_utilization = (cpu_utilization + memory_utilization) / 2
        
        if avg_utilization > self.scale_down_utilization_threshold:
            # Node is being used, reset idle timer
            if node_name in self.node_idle_since:
                del self.node_idle_since[node_name]
            return False, f"Node utilization ({avg_utilization:.1%}) above threshold"
        
        # Node is underutilized
        now = datetime.utcnow()
        
        if node_name not in self.node_idle_since:
            self.node_idle_since[node_name] = now
            return False, "Node marked as idle, starting cooldown"
        
        idle_duration = now - self.node_idle_since[node_name]
        
        if idle_duration < self.scale_down_delay:
            remaining = (self.scale_down_delay - idle_duration).seconds
            return False, f"Node idle, {remaining}s until scale-down eligible"
        
        return True, f"Node idle for {idle_duration.seconds}s, eligible for removal"
    
    def reset_idle_timer(self, node_name: str) -> None:
        """Reset the idle timer for a node."""
        if node_name in self.node_idle_since:
            del self.node_idle_since[node_name]
