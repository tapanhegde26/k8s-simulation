"""Event bus for broadcasting cluster events to WebSocket clients."""

import asyncio
from collections import defaultdict
from typing import Callable, Coroutine, Any
from uuid import UUID

from app.schemas.events import ClusterEvent, EventType


class EventBus:
    """
    Pub/sub event bus for cluster events.
    
    Allows services to publish events and WebSocket handlers to subscribe.
    """
    
    def __init__(self):
        self._subscribers: dict[UUID, list[Callable[[ClusterEvent], Coroutine[Any, Any, None]]]] = defaultdict(list)
        self._global_subscribers: list[Callable[[ClusterEvent], Coroutine[Any, Any, None]]] = []
        self._event_history: dict[UUID, list[ClusterEvent]] = defaultdict(list)
        self._max_history = 100
    
    async def publish(self, event: ClusterEvent) -> None:
        """
        Publish an event to all subscribers of the cluster.
        
        Args:
            event: The cluster event to publish
        """
        # Store in history
        history = self._event_history[event.cluster_id]
        history.append(event)
        if len(history) > self._max_history:
            history.pop(0)
        
        # Notify cluster-specific subscribers
        for callback in self._subscribers[event.cluster_id]:
            try:
                await callback(event)
            except Exception as e:
                print(f"Error in event subscriber: {e}")
        
        # Notify global subscribers
        for callback in self._global_subscribers:
            try:
                await callback(event)
            except Exception as e:
                print(f"Error in global event subscriber: {e}")
    
    def subscribe(
        self,
        cluster_id: UUID,
        callback: Callable[[ClusterEvent], Coroutine[Any, Any, None]]
    ) -> Callable[[], None]:
        """
        Subscribe to events for a specific cluster.
        
        Args:
            cluster_id: The cluster to subscribe to
            callback: Async function to call when events occur
            
        Returns:
            Unsubscribe function
        """
        self._subscribers[cluster_id].append(callback)
        
        def unsubscribe():
            if callback in self._subscribers[cluster_id]:
                self._subscribers[cluster_id].remove(callback)
        
        return unsubscribe
    
    def subscribe_global(
        self,
        callback: Callable[[ClusterEvent], Coroutine[Any, Any, None]]
    ) -> Callable[[], None]:
        """
        Subscribe to all events across all clusters.
        
        Args:
            callback: Async function to call when events occur
            
        Returns:
            Unsubscribe function
        """
        self._global_subscribers.append(callback)
        
        def unsubscribe():
            if callback in self._global_subscribers:
                self._global_subscribers.remove(callback)
        
        return unsubscribe
    
    def get_history(self, cluster_id: UUID, limit: int = 50) -> list[ClusterEvent]:
        """
        Get recent event history for a cluster.
        
        Args:
            cluster_id: The cluster to get history for
            limit: Maximum number of events to return
            
        Returns:
            List of recent events
        """
        history = self._event_history.get(cluster_id, [])
        return history[-limit:]
    
    def clear_history(self, cluster_id: UUID) -> None:
        """Clear event history for a cluster."""
        if cluster_id in self._event_history:
            del self._event_history[cluster_id]
    
    def clear_subscribers(self, cluster_id: UUID) -> None:
        """Remove all subscribers for a cluster."""
        if cluster_id in self._subscribers:
            del self._subscribers[cluster_id]


# Global event bus instance
event_bus = EventBus()
