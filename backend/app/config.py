"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "K8s Simulation API"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./k8s_simulation.db"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Simulation defaults
    default_master_nodes: int = 1
    default_worker_nodes: int = 2
    max_pods_per_node: int = 110
    default_node_cpu_millicores: int = 4000
    default_node_memory_mb: int = 8192

    # WebSocket
    ws_heartbeat_interval: int = 30


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
