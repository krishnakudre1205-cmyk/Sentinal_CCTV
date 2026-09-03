import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket


class AlertWebSocketManager:
    """
    Module 6: Real-Time Alert WebSocket Connection Manager.
    Broadcasting live alerts to connected Police Command Center dashboards.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts incoming WebSocket connection and registers client."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Unregisters client WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Total active connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts JSON alert object to all connected dashboard clients."""
        if not self.active_connections:
            return

        disconnected_clients = []
        payload_str = json.dumps(message, default=str)

        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                print(f"[WebSocket Broadcast Error]: {e}")
                disconnected_clients.append(connection)

        for dead_client in disconnected_clients:
            self.disconnect(dead_client)


# Singleton instance
alert_ws_manager = AlertWebSocketManager()
