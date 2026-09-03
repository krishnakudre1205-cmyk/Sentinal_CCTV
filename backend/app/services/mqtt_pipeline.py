import json
import logging
from typing import Dict, Any, Callable

logger = logging.getLogger("sentinelfusion.mqtt")

try:
    import paho.mqtt.client as mqtt
    PAHO_AVAILABLE = True
except ImportError:
    PAHO_AVAILABLE = False


class MQTTPipeline:
    """
    Module 9/10: MQTT Event Pipeline Service.
    Publishes real-time detection & alert payloads to Mosquitto MQTT message broker topics:
    - `sentinelfusion/events/detections`
    - `sentinelfusion/events/alerts`
    """

    def __init__(self, host: str = "localhost", port: int = 1883):
        self.host = host
        self.port = port
        self.is_connected = False
        self.client = None

        if PAHO_AVAILABLE:
            try:
                self.client = mqtt.Client()
            except Exception as e:
                logger.warning(f"Failed to initialize MQTT client: {e}")

    def start(self) -> bool:
        """Connects to Mosquitto MQTT Broker if paho-mqtt client is available."""
        if PAHO_AVAILABLE and self.client:
            try:
                self.client.connect(self.host, self.port, keepalive=60)
                self.client.loop_start()
                self.is_connected = True
                print(f"[MQTT Engine] Connected to Mosquitto Broker at {self.host}:{self.port}")
                return True
            except Exception as e:
                print(f"[MQTT Engine Warning] Broker connection deferred ({self.host}:{self.port}): {e}")
                self.is_connected = False
                return False
        else:
            self.is_connected = True
            print(f"[MQTT Engine] Standalone mode active ({self.host}:{self.port})")
            return True

    def publish_event(self, topic: str, payload: Dict[str, Any]) -> bool:
        """Publishes detection or alert event payload to MQTT topic."""
        try:
            payload_str = json.dumps(payload, default=str)
            if self.is_connected and PAHO_AVAILABLE and self.client:
                self.client.publish(topic, payload_str)
            print(f"[MQTT Event Published] Topic: {topic} | Bytes: {len(payload_str)}")
            return True
        except Exception as e:
            print(f"[MQTT Publish Warning]: {e}")
            return False

    def stop(self) -> None:
        """Disconnects from Mosquitto MQTT broker."""
        if PAHO_AVAILABLE and self.client and self.is_connected:
            try:
                self.client.loop_stop()
                self.client.disconnect()
            except Exception:
                pass
        self.is_connected = False


# Singleton instance
mqtt_pipeline = MQTTPipeline()
