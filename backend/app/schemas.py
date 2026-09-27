"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ── Auth ───────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    college: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User ───────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    name: str
    email: str
    college: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SkillOut(BaseModel):
    id: int
    name: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserSkillOut(BaseModel):
    id: int
    skill_id: int
    skill: SkillOut
    type: str
    proficiency_level: int
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilityOut(BaseModel):
    id: int
    day_of_week: str
    start_time: str
    end_time: str
    mode: str
    timezone: str

    class Config:
        from_attributes = True


class UserProfile(UserPublic):
    user_skills: List[UserSkillOut] = []
    availability: List[AvailabilityOut] = []
    rating_avg: Optional[float] = None
    completed_sessions: int = 0
    credit_balance: int = 0

    class Config:
        from_attributes = True


# ── Skills ─────────────────────────────────────────────────────────

class AddUserSkill(BaseModel):
    skill_id: int
    type: str = Field(..., pattern="^(teach|learn)$")
    proficiency_level: int = Field(50, ge=0, le=100)


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    category: str


# ── Availability ───────────────────────────────────────────────────

class AddAvailability(BaseModel):
    day_of_week: str
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    mode: str = "online"
    timezone: str = "UTC"


# ── Matching ───────────────────────────────────────────────────────

class MatchResult(BaseModel):
    user: UserPublic
    score: float
    teaches: List[SkillOut] = []
    wants_to_learn: List[SkillOut] = []
    shared_availability: int = 0

    class Config:
        from_attributes = True


# ── Exchange Requests ──────────────────────────────────────────────

class ExchangeRequestCreate(BaseModel):
    recipient_id: int
    requester_skill_id: int
    recipient_skill_id: int
    message: Optional[str] = None


class ExchangeRequestUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|declined|cancelled)$")


class ExchangeRequestOut(BaseModel):
    id: int
    requester_id: int
    recipient_id: int
    requester_skill_id: int
    recipient_skill_id: int
    status: str
    message: Optional[str] = None
    created_at: datetime
    requester: Optional[UserPublic] = None
    recipient: Optional[UserPublic] = None
    requester_skill: Optional[SkillOut] = None
    recipient_skill: Optional[SkillOut] = None

    class Config:
        from_attributes = True


# ── Sessions ───────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    exchange_request_id: int
    scheduled_at: datetime
    duration_minutes: int = 60
    mode: str = "online"
    meeting_link_or_location: Optional[str] = None


class SessionUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    meeting_link_or_location: Optional[str] = None


class SessionOut(BaseModel):
    id: int
    exchange_request_id: int
    scheduled_at: datetime
    duration_minutes: int
    mode: str
    status: str
    meeting_link_or_location: Optional[str] = None
    completed_by_teacher_at: Optional[datetime] = None
    completed_by_learner_at: Optional[datetime] = None
    created_at: datetime
    exchange_request: Optional[ExchangeRequestOut] = None

    class Config:
        from_attributes = True


# ── Reviews ────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    teaching_quality: Optional[int] = Field(None, ge=1, le=5)
    knowledge: Optional[int] = Field(None, ge=1, le=5)
    communication: Optional[int] = Field(None, ge=1, le=5)
    would_learn_again: Optional[bool] = None
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    session_id: int
    reviewer_id: int
    reviewee_id: int
    rating: int
    teaching_quality: Optional[int] = None
    knowledge: Optional[int] = None
    communication: Optional[int] = None
    would_learn_again: Optional[bool] = None
    comment: Optional[str] = None
    created_at: datetime
    reviewer: Optional[UserPublic] = None

    class Config:
        from_attributes = True


# ── Credits ────────────────────────────────────────────────────────

class CreditOut(BaseModel):
    balance: int
    updated_at: datetime

    class Config:
        from_attributes = True


class CreditTransactionOut(BaseModel):
    id: int
    amount: int
    reason: str
    session_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
