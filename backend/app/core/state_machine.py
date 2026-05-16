"""State machine for Kubernetes resource lifecycle management."""

from datetime import datetime
from enum import Enum
from typing import Optional, Callable, Any
from dataclasses import dataclass, field


class PodState(str, Enum):
    """Pod lifecycle states."""
    PENDING = "Pending"
    SCHEDULING = "Scheduling"
    SCHEDULED = "Scheduled"
    CONTAINER_CREATING = "ContainerCreating"
    RUNNING = "Running"
    SUCCEEDED = "Succeeded"
    FAILED = "Failed"
    TERMINATING = "Terminating"
    TERMINATED = "Terminated"


class DeploymentState(str, Enum):
    """Deployment lifecycle states."""
    PENDING = "Pending"
    PROGRESSING = "Progressing"
    AVAILABLE = "Available"
    SCALING = "Scaling"
    ROLLING_UPDATE = "RollingUpdate"
    FAILED = "Failed"


class NodeState(str, Enum):
    """Node lifecycle states."""
    PENDING = "Pending"
    READY = "Ready"
    NOT_READY = "NotReady"
    CORDONED = "Cordoned"
    DRAINING = "Draining"


@dataclass
class Transition:
    """State transition definition."""
    from_state: Enum
    to_state: Enum
    condition: Optional[Callable[..., bool]] = None
    on_transition: Optional[Callable[..., Any]] = None


@dataclass
class StateMachine:
    """
    Generic state machine for resource lifecycle management.
    
    Manages valid state transitions and triggers callbacks.
    """
    current_state: Enum
    transitions: list[Transition] = field(default_factory=list)
    history: list[tuple[Enum, datetime]] = field(default_factory=list)
    
    def __post_init__(self):
        self.history.append((self.current_state, datetime.utcnow()))
    
    def can_transition(self, to_state: Enum, **context) -> bool:
        """Check if transition to target state is valid."""
        for t in self.transitions:
            if t.from_state == self.current_state and t.to_state == to_state:
                if t.condition is None:
                    return True
                return t.condition(**context)
        return False
    
    def transition(self, to_state: Enum, **context) -> bool:
        """
        Attempt to transition to a new state.
        
        Returns True if transition was successful.
        """
        for t in self.transitions:
            if t.from_state == self.current_state and t.to_state == to_state:
                if t.condition is not None and not t.condition(**context):
                    continue
                
                old_state = self.current_state
                self.current_state = to_state
                self.history.append((to_state, datetime.utcnow()))
                
                if t.on_transition:
                    t.on_transition(old_state, to_state, **context)
                
                return True
        return False
    
    def get_valid_transitions(self, **context) -> list[Enum]:
        """Get list of valid states we can transition to."""
        valid = []
        for t in self.transitions:
            if t.from_state == self.current_state:
                if t.condition is None or t.condition(**context):
                    valid.append(t.to_state)
        return valid


def create_pod_state_machine(initial_state: PodState = PodState.PENDING) -> StateMachine:
    """Create a state machine for pod lifecycle."""
    transitions = [
        # Normal flow
        Transition(PodState.PENDING, PodState.SCHEDULING),
        Transition(PodState.SCHEDULING, PodState.SCHEDULED),
        Transition(PodState.SCHEDULED, PodState.CONTAINER_CREATING),
        Transition(PodState.CONTAINER_CREATING, PodState.RUNNING),
        Transition(PodState.RUNNING, PodState.SUCCEEDED),
        
        # Failure paths
        Transition(PodState.PENDING, PodState.FAILED),
        Transition(PodState.SCHEDULING, PodState.FAILED),
        Transition(PodState.SCHEDULED, PodState.FAILED),
        Transition(PodState.CONTAINER_CREATING, PodState.FAILED),
        Transition(PodState.RUNNING, PodState.FAILED),
        
        # Termination
        Transition(PodState.PENDING, PodState.TERMINATING),
        Transition(PodState.SCHEDULING, PodState.TERMINATING),
        Transition(PodState.SCHEDULED, PodState.TERMINATING),
        Transition(PodState.CONTAINER_CREATING, PodState.TERMINATING),
        Transition(PodState.RUNNING, PodState.TERMINATING),
        Transition(PodState.FAILED, PodState.TERMINATING),
        Transition(PodState.TERMINATING, PodState.TERMINATED),
        
        # Restart from failed
        Transition(PodState.FAILED, PodState.PENDING),
    ]
    
    return StateMachine(current_state=initial_state, transitions=transitions)


def create_deployment_state_machine(
    initial_state: DeploymentState = DeploymentState.PENDING
) -> StateMachine:
    """Create a state machine for deployment lifecycle."""
    transitions = [
        # Normal flow
        Transition(DeploymentState.PENDING, DeploymentState.PROGRESSING),
        Transition(DeploymentState.PROGRESSING, DeploymentState.AVAILABLE),
        
        # Scaling
        Transition(DeploymentState.AVAILABLE, DeploymentState.SCALING),
        Transition(DeploymentState.SCALING, DeploymentState.AVAILABLE),
        Transition(DeploymentState.SCALING, DeploymentState.PROGRESSING),
        
        # Rolling update
        Transition(DeploymentState.AVAILABLE, DeploymentState.ROLLING_UPDATE),
        Transition(DeploymentState.ROLLING_UPDATE, DeploymentState.AVAILABLE),
        Transition(DeploymentState.ROLLING_UPDATE, DeploymentState.FAILED),
        
        # Failure
        Transition(DeploymentState.PENDING, DeploymentState.FAILED),
        Transition(DeploymentState.PROGRESSING, DeploymentState.FAILED),
        Transition(DeploymentState.SCALING, DeploymentState.FAILED),
        
        # Recovery
        Transition(DeploymentState.FAILED, DeploymentState.PROGRESSING),
    ]
    
    return StateMachine(current_state=initial_state, transitions=transitions)


def create_node_state_machine(initial_state: NodeState = NodeState.PENDING) -> StateMachine:
    """Create a state machine for node lifecycle."""
    transitions = [
        # Normal flow
        Transition(NodeState.PENDING, NodeState.READY),
        Transition(NodeState.PENDING, NodeState.NOT_READY),
        
        # Health changes
        Transition(NodeState.READY, NodeState.NOT_READY),
        Transition(NodeState.NOT_READY, NodeState.READY),
        
        # Maintenance
        Transition(NodeState.READY, NodeState.CORDONED),
        Transition(NodeState.NOT_READY, NodeState.CORDONED),
        Transition(NodeState.CORDONED, NodeState.DRAINING),
        Transition(NodeState.CORDONED, NodeState.READY),
        Transition(NodeState.DRAINING, NodeState.NOT_READY),
    ]
    
    return StateMachine(current_state=initial_state, transitions=transitions)
