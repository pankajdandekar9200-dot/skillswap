"""
Auth routes — signup, login, refresh, verify-email, password reset.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import User, Credit
from app.schemas import SignupRequest, LoginRequest, TokenResponse, RefreshRequest
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.config import INITIAL_CREDITS

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest, db: DBSession = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Try logging in instead.",
        )
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        college=body.college,
    )
    db.add(user)
    db.flush()

    # Grant initial credits
    credit = Credit(user_id=user.id, balance=INITIAL_CREDITS)
    db.add(credit)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password. Please check and try again.",
        )
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")
    user_id = payload.get("sub")
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/verify-email")
def verify_email():
    """Phase 2 — email verification stub."""
    return {"message": "Email verification will be available soon."}


@router.post("/request-password-reset")
def request_password_reset():
    """Phase 2 — password reset stub."""
    return {"message": "Password reset instructions have been sent if the email exists."}


@router.post("/reset-password")
def reset_password():
    """Phase 2 — password reset stub."""
    return {"message": "Password reset will be available soon."}
