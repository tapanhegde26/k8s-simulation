"""WebSocket endpoint for real-time cluster events."""

import asyncio
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.config import settings
from app.core.events import event_bus, ClusterEvent
from app.schemas.events import EventType, EventSeverity
from app.services.simulator import get_simulator

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for cluster events."""
    
    def __init__(self):
        self.active_connections: dict[UUID, list[WebSocket]] = {}
        self.unsubscribe_funcs: dict[WebSocket, callable] = {}
    
    async def connect(self, websocket: WebSocket, cluster_id: UUID) -> bool:
        """Accept and register a WebSocket connection."""
        simulator = get_simulator(cluster_id)
        if not simulator:
            await websocket.close(code=4004, reason="Cluster not found")
            return False
        
        await websocket.accept()
        
        if cluster_id not in self.active_connections:
            self.active_connections[cluster_id] = []
        
        self.active_connections[cluster_id].append(websocket)
        
        # Subscribe to cluster events
        async def on_event(event: ClusterEvent):
            await self.send_event(websocket, event)
        
        unsubscribe = event_bus.subscribe(cluster_id, on_event)
        self.unsubscribe_funcs[websocket] = unsubscribe
        
        # Send connection confirmation
        await self.send_event(websocket, ClusterEvent(
            id=UUID(int=0),
            type=EventType.CONNECTED,
            severity=EventSeverity.INFO,
            cluster_id=cluster_id,
            message="Connected to cluster event stream",
            details={"cluster_name": simulator.config.name}
        ))
        
        return True
    
    def disconnect(self, websocket: WebSocket, cluster_id: UUID):
        """Remove a WebSocket connection."""
        if cluster_id in self.active_connections:
            if websocket in self.active_connections[cluster_id]:
                self.active_connections[cluster_id].remove(websocket)
        
        # Unsubscribe from events
        if websocket in self.unsubscribe_funcs:
            self.unsubscribe_funcs[websocket]()
            del self.unsubscribe_funcs[websocket]
    
    async def send_event(self, websocket: WebSocket, event: ClusterEvent):
        """Send an event to a specific WebSocket."""
        try:
            await websocket.send_json(event.model_dump(mode="json"))
        except Exception:
            pass
    
    async def broadcast(self, cluster_id: UUID, event: ClusterEvent):
        """Broadcast an event to all connections for a cluster."""
        if cluster_id not in self.active_connections:
            return
        
        disconnected = []
        for websocket in self.active_connections[cluster_id]:
            try:
                await websocket.send_json(event.model_dump(mode="json"))
            except Exception:
                disconnected.append(websocket)
        
        # Clean up disconnected
        for ws in disconnected:
            self.disconnect(ws, cluster_id)


manager = ConnectionManager()


@router.websocket("/ws/clusters/{cluster_id}/events")
async def websocket_endpoint(
    websocket: WebSocket,
    cluster_id: UUID,
    include_history: bool = Query(False, description="Include recent event history on connect")
):
    """
    WebSocket endpoint for real-time cluster events.
    
    Connect to receive live updates about:
    - Pod lifecycle events (created, scheduled, running, failed, deleted)
    - Deployment events (created, scaled, updated)
    - Node events (added, removed, status changes)
    - HPA events (scaling decisions)
    - And more...
    
    Query Parameters:
    - include_history: If true, sends recent events on connection
    """
    connected = await manager.connect(websocket, cluster_id)
    
    if not connected:
        return
    
    # Send event history if requested
    if include_history:
        history = event_bus.get_history(cluster_id, limit=20)
        for event in history:
            await manager.send_event(websocket, event)
    
    try:
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages (ping/pong or commands)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=settings.ws_heartbeat_interval
                )
                
                # Handle client commands
                try:
                    message = json.loads(data)
                    await handle_client_message(websocket, cluster_id, message)
                except json.JSONDecodeError:
                    pass
                    
            except asyncio.TimeoutError:
                # Send heartbeat
                await manager.send_event(websocket, ClusterEvent(
                    id=UUID(int=0),
                    type=EventType.HEARTBEAT,
                    severity=EventSeverity.INFO,
                    cluster_id=cluster_id,
                    message="heartbeat",
                    details={"timestamp": datetime.utcnow().isoformat()}
                ))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, cluster_id)
    except Exception as e:
        manager.disconnect(websocket, cluster_id)


async def handle_client_message(websocket: WebSocket, cluster_id: UUID, message: dict):
    """Handle incoming WebSocket messages from clients."""
    action = message.get("action")
    
    if action == "ping":
        await websocket.send_json({"action": "pong", "timestamp": datetime.utcnow().isoformat()})
    
    elif action == "get_history":
        limit = message.get("limit", 50)
        history = event_bus.get_history(cluster_id, limit=limit)
        await websocket.send_json({
            "action": "history",
            "events": [e.model_dump(mode="json") for e in history]
        })
    
    elif action == "subscribe_filter":
        # Future: Allow filtering events by type
        pass
