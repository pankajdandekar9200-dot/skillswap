"""
Credits routes — balance + transaction history.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Credit, CreditTransaction, User
from app.schemas import CreditOut, CreditTransactionOut
from app.auth import get_current_user

router = APIRouter(prefix="/credits", tags=["Credits"])


@router.get("/me", response_model=CreditOut)
def get_my_credits(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    credit = db.query(Credit).filter(Credit.user_id == current_user.id).first()
    if not credit:
        credit = Credit(user_id=current_user.id, balance=0)
        db.add(credit)
        db.commit()
        db.refresh(credit)
    return credit


@router.get("/me/transactions", response_model=List[CreditTransactionOut])
def get_my_transactions(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .all()
    )


@router.post("/redeem")
def redeem_credits():
    """Phase 2 — credit redemption stub."""
    return {"message": "Credit redemption will be available soon."}
