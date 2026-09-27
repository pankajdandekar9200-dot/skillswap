"""
SQLAlchemy ORM models — maps to the schema defined in Section 10.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Enum, ForeignKey,
    UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ── Enums ──────────────────────────────────────────────────────────

class SkillCategory(str, enum.Enum):
    TECH = "Tech"
    DESIGN = "Design"
    COMMUNICATION = "Communication"
    ARTS = "Arts"
    BUSINESS = "Business"
    ACADEMICS = "Academics"


class SkillType(str, enum.Enum):
    TEACH = "teach"
    LEARN = "learn"


class ExchangeRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    MISSED = "missed"
    CANCELLED = "cancelled"


class SessionMode(str, enum.Enum):
    ONLINE = "online"
    IN_PERSON = "in-person"


class CreditReason(str, enum.Enum):
    SESSION_TAUGHT = "session_taught"
    INITIAL_GRANT = "initial_grant"
    REDEMPTION = "redemption"
    ADJUSTMENT = "adjustment"


class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


# ── Models ─────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    college = Column(String(255), nullable=True)
    profile_photo_url = Column(String(512), nullable=True)
    bio = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    user_skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    availability = relationship("Availability", back_populates="user", cascade="all, delete-orphan")
    credit = relationship("Credit", back_populates="user", uselist=False)
    credit_transactions = relationship("CreditTransaction", back_populates="user")
    sent_requests = relationship(
        "ExchangeRequest", foreign_keys="ExchangeRequest.requester_id", back_populates="requester"
    )
    received_requests = relationship(
        "ExchangeRequest", foreign_keys="ExchangeRequest.recipient_id", back_populates="recipient"
    )
    reviews_given = relationship(
        "Review", foreign_keys="Review.reviewer_id", back_populates="reviewer"
    )
    reviews_received = relationship(
        "Review", foreign_keys="Review.reviewee_id", back_populates="reviewee"
    )


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_skills = relationship("UserSkill", back_populates="skill")


class UserSkill(Base):
    __tablename__ = "user_skills"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", "type", name="uq_user_skill_type"),
        Index("ix_user_skills_user_id", "user_id"),
        Index("ix_user_skills_skill_id", "skill_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(10), nullable=False)  # "teach" | "learn"
    proficiency_level = Column(Integer, default=50)  # 0-100
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_skills")
    skill = relationship("Skill", back_populates="user_skills")


class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(String(5), nullable=False)  # "HH:MM"
    end_time = Column(String(5), nullable=False)    # "HH:MM"
    mode = Column(String(20), default="online")     # "online" | "in-person"
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="availability")


class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"
    __table_args__ = (
        Index("ix_exchange_requests_requester", "requester_id"),
        Index("ix_exchange_requests_recipient", "recipient_id"),
        Index("ix_exchange_requests_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requester_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    recipient_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    status = Column(String(20), default="pending")
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_requests")
    requester_skill = relationship("Skill", foreign_keys=[requester_skill_id])
    recipient_skill = relationship("Skill", foreign_keys=[recipient_skill_id])
    sessions = relationship("Session", back_populates="exchange_request")


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        Index("ix_sessions_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    exchange_request_id = Column(
        Integer, ForeignKey("exchange_requests.id", ondelete="CASCADE"), nullable=False
    )
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    mode = Column(String(20), default="online")
    status = Column(String(20), default="scheduled")
    meeting_link_or_location = Column(String(512), nullable=True)
    completed_by_teacher_at = Column(DateTime, nullable=True)
    completed_by_learner_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    exchange_request = relationship("ExchangeRequest", back_populates="sessions")
    reviews = relationship("Review", back_populates="session")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("session_id", "reviewer_id", name="uq_session_reviewer"),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    teaching_quality = Column(Integer, nullable=True)  # 1-5
    knowledge = Column(Integer, nullable=True)  # 1-5
    communication = Column(Integer, nullable=True)  # 1-5
    would_learn_again = Column(Boolean, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")


class Credit(Base):
    __tablename__ = "credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="credit")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    __table_args__ = (
        Index("ix_credit_transactions_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Integer, nullable=False)
    reason = Column(String(30), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credit_transactions")
