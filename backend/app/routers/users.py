"""
User profile routes — get/update own profile, view public profiles.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
from app.database import get_db
from app.models import User, Review, Session, ExchangeRequest, Credit
from app.schemas import UserPublic, UserProfile, UserUpdate, UserSkillOut, AvailabilityOut
from app.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


def _build_profile(user: User, db: DBSession) -> dict:
    """Build full profile dict with computed fields."""
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.reviewee_id == user.id).scalar()
    
    completed_count = (
        db.query(Session)
        .join(ExchangeRequest)
        .filter(
            Session.status == "completed",
            (ExchangeRequest.requester_id == user.id) | (ExchangeRequest.recipient_id == user.id),
        )
        .count()
    )
    
    credit = db.query(Credit).filter(Credit.user_id == user.id).first()
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "college": user.college,
        "profile_photo_url": user.profile_photo_url,
        "bio": user.bio,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "user_skills": [
            UserSkillOut.model_validate(us) for us in user.user_skills
        ],
        "availability": [
            AvailabilityOut.model_validate(a) for a in user.availability
        ],
        "rating_avg": round(avg_rating, 2) if avg_rating else None,
        "completed_sessions": completed_count,
        "credit_balance": credit.balance if credit else 0,
    }


@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    return _build_profile(current_user, db)


@router.patch("/me", response_model=UserPublic)
def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    if body.name is not None:
        current_user.name = body.name
    if body.bio is not None:
        current_user.bio = body.bio
    if body.college is not None:
        current_user.college = body.college
    if body.profile_photo_url is not None:
        current_user.profile_photo_url = body.profile_photo_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserProfile)
def get_user(user_id: int, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return _build_profile(user, db)
