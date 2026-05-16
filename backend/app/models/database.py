"""SQLAlchemy models for persistent storage."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import String, Text, Integer, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ClusterModel(Base):
    """Persistent cluster state."""
    
    __tablename__ = "clusters"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(63), nullable=False)
    kubernetes_version: Mapped[str] = mapped_column(String(20), default="1.28.0")
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="Creating")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    events: Mapped[list["EventModel"]] = relationship(back_populates="cluster", cascade="all, delete-orphan")


class EventModel(Base):
    """Persistent event log."""
    
    __tablename__ = "events"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    cluster_id: Mapped[str] = mapped_column(String(36), ForeignKey("clusters.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="info")
    resource_type: Mapped[Optional[str]] = mapped_column(String(50))
    resource_name: Mapped[Optional[str]] = mapped_column(String(253))
    resource_namespace: Mapped[Optional[str]] = mapped_column(String(63))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    cluster: Mapped["ClusterModel"] = relationship(back_populates="events")


class UserProgressModel(Base):
    """User learning progress."""
    
    __tablename__ = "user_progress"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    scenario_id: Mapped[str] = mapped_column(String(36), nullable=False)
    cluster_id: Mapped[str] = mapped_column(String(36), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    objectives_completed: Mapped[list] = mapped_column(JSON, default=list)
    hints_revealed: Mapped[list] = mapped_column(JSON, default=list)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)


class BadgeModel(Base):
    """User earned badges."""
    
    __tablename__ = "badges"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    badge_type: Mapped[str] = mapped_column(String(50), nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
