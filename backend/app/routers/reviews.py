"""
Review routes — post review for a completed session, list reviews by user.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Review, Session, ExchangeRequest, User
from app.schemas import ReviewCreate, ReviewOut
from app.auth import get_current_user

router = APIRouter(tags=["Reviews"])


@router.post("/sessions/{session_id}/review", response_model=ReviewOut, status_code=201)
def create_review(
    session_id: int,
    body: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    if session.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="You can only review a completed session.",
        )

    er = session.exchange_request
    if er.requester_id != current_user.id and er.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You're not part of this session.")

    # Determine the reviewee — the other person
    reviewee_id = er.recipient_id if current_user.id == er.requester_id else er.requester_id

    # Check for duplicate review
    existing = (
        db.query(Review)
        .filter(Review.session_id == session_id, Review.reviewer_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You've already reviewed this session.",
        )

    review = Review(
        session_id=session_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating=body.rating,
        teaching_quality=body.teaching_quality,
        knowledge=body.knowledge,
        communication=body.communication,
        would_learn_again=body.would_learn_again,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/users/{user_id}/reviews", response_model=List[ReviewOut])
def get_user_reviews(user_id: int, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    reviews = (
        db.query(Review)
        .filter(Review.reviewee_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews
