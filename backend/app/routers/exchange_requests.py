"""
Exchange request routes — create, list, accept/decline/cancel.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import ExchangeRequest, User, Skill
from app.schemas import ExchangeRequestCreate, ExchangeRequestUpdate, ExchangeRequestOut
from app.auth import get_current_user

router = APIRouter(prefix="/exchange-requests", tags=["Exchange Requests"])


@router.post("", response_model=ExchangeRequestOut, status_code=201)
def create_exchange_request(
    body: ExchangeRequestCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    if body.recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't send a request to yourself.")

    recipient = db.query(User).filter(User.id == body.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    req_skill = db.query(Skill).filter(Skill.id == body.requester_skill_id).first()
    rec_skill = db.query(Skill).filter(Skill.id == body.recipient_skill_id).first()
    if not req_skill or not rec_skill:
        raise HTTPException(status_code=404, detail="One or both skills not found.")

    # Check for duplicate pending request
    existing = (
        db.query(ExchangeRequest)
        .filter(
            ExchangeRequest.requester_id == current_user.id,
            ExchangeRequest.recipient_id == body.recipient_id,
            ExchangeRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending request to this person. Wait for their response.",
        )

    er = ExchangeRequest(
        requester_id=current_user.id,
        recipient_id=body.recipient_id,
        requester_skill_id=body.requester_skill_id,
        recipient_skill_id=body.recipient_skill_id,
        status="pending",
        message=body.message,
    )
    db.add(er)
    db.commit()
    db.refresh(er)
    return er


@router.get("", response_model=List[ExchangeRequestOut])
def list_exchange_requests(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    q = db.query(ExchangeRequest).filter(
        (ExchangeRequest.requester_id == current_user.id) |
        (ExchangeRequest.recipient_id == current_user.id)
    )
    if status:
        q = q.filter(ExchangeRequest.status == status)
    return q.order_by(ExchangeRequest.created_at.desc()).all()


@router.get("/{req_id}", response_model=ExchangeRequestOut)
def get_exchange_request(
    req_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    er = db.query(ExchangeRequest).filter(ExchangeRequest.id == req_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Exchange request not found.")
    if er.requester_id != current_user.id and er.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this request.")
    return er


@router.patch("/{req_id}", response_model=ExchangeRequestOut)
def update_exchange_request(
    req_id: int,
    body: ExchangeRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    er = db.query(ExchangeRequest).filter(ExchangeRequest.id == req_id).first()
    if not er:
        raise HTTPException(status_code=404, detail="Exchange request not found.")

    # Only the recipient can accept/decline; only the requester can cancel
    if body.status in ("accepted", "declined"):
        if er.recipient_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the recipient can accept or decline this request.",
            )
    elif body.status == "cancelled":
        if er.requester_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the requester can cancel this request.",
            )

    if er.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"This request is already {er.status}. Only pending requests can be updated.",
        )

    er.status = body.status
    db.commit()
    db.refresh(er)
    return er
