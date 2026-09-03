import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "sentinelfusion.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelFusion AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database Configuration (Absolute path to SQLite database inside backend directory)
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"
    
    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # MQTT Broker Settings (Future pipeline configuration)
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_TOPIC_DETECTIONS: str = "sentinelfusion/events/detections"
    MQTT_TOPIC_ALERTS: str = "sentinelfusion/events/alerts"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
