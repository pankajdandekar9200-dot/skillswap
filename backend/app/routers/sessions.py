"""
Session routes — schedule, mark complete, list.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Session, ExchangeRequest, User, Credit, CreditTransaction
from app.schemas import SessionCreate, SessionUpdate, SessionOut
from app.auth import get_current_user
from app.config import CREDITS_PER_SESSION_TAUGHT

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", response_model=SessionOut, status_code=201)
def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    er = db.query(ExchangeRequest).filter(ExchangeRequest.id == body.exchange_request_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Exchange request not found.")
    if er.status != "accepted":
        raise HTTPException(
            status_code=400,
            detail="Sessions can only be created for accepted exchange requests.",
        )
    if er.requester_id != current_user.id and er.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You're not part of this exchange.")

    session = Session(
        exchange_request_id=body.exchange_request_id,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        mode=body.mode,
        meeting_link_or_location=body.meeting_link_or_location,
        status="scheduled",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=List[SessionOut])
def list_sessions(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    q = (
        db.query(Session)
        .join(ExchangeRequest)
        .filter(
            (ExchangeRequest.requester_id == current_user.id) |
            (ExchangeRequest.recipient_id == current_user.id)
        )
    )
    if status:
        q = q.filter(Session.status == status)
    return q.order_by(Session.scheduled_at.desc()).all()


@router.get("/{session_id}", response_model=SessionOut)
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    er = session.exchange_request
    if er.requester_id != current_user.id and er.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You're not part of this session.")
    return session


@router.patch("/{session_id}", response_model=SessionOut)
def update_session(
    session_id: int,
    body: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    er = session.exchange_request
    if er.requester_id != current_user.id and er.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You're not part of this session.")

    if body.scheduled_at is not None:
        session.scheduled_at = body.scheduled_at

    if body.meeting_link_or_location is not None:
        session.meeting_link_or_location = body.meeting_link_or_location

    if body.status is not None:
        if body.status == "completed" and session.status == "scheduled":
            session.status = "completed"
            now = datetime.utcnow()

            # Determine who is the teacher in this exchange
            # The recipient teaches their skill, the requester teaches theirs
            # Award credits to both participants for teaching
            for user_id in [er.requester_id, er.recipient_id]:
                credit = db.query(Credit).filter(Credit.user_id == user_id).first()
                if credit:
                    credit.balance += CREDITS_PER_SESSION_TAUGHT
                else:
                    credit = Credit(user_id=user_id, balance=CREDITS_PER_SESSION_TAUGHT)
                    db.add(credit)

                tx = CreditTransaction(
                    user_id=user_id,
                    amount=CREDITS_PER_SESSION_TAUGHT,
                    reason="session_taught",
                    session_id=session.id,
                )
                db.add(tx)

            session.completed_by_teacher_at = now
            session.completed_by_learner_at = now
        elif body.status == "cancelled":
            session.status = "cancelled"
        elif body.status == "missed":
            session.status = "missed"

    db.commit()
    db.refresh(session)
    return session
