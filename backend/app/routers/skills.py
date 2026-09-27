"""
Skills catalog + user skill management + availability.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Skill, UserSkill, Availability, User
from app.schemas import (
    SkillOut, SkillCreate, AddUserSkill, UserSkillOut,
    AddAvailability, AvailabilityOut,
)
from app.auth import get_current_user

router = APIRouter(tags=["Skills"])


# ── Skill catalog ──────────────────────────────────────────────────

@router.get("/skills", response_model=List[SkillOut])
def list_skills(category: Optional[str] = None, db: DBSession = Depends(get_db)):
    q = db.query(Skill)
    if category:
        q = q.filter(Skill.category == category)
    return q.order_by(Skill.name).all()


@router.post("/skills", response_model=SkillOut, status_code=201)
def create_skill(body: SkillCreate, db: DBSession = Depends(get_db)):
    existing = db.query(Skill).filter(Skill.name == body.name).first()
    if existing:
        return existing
    skill = Skill(name=body.name, category=body.category)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


# ── User skills ────────────────────────────────────────────────────

@router.get("/users/me/skills", response_model=List[UserSkillOut])
def get_my_skills(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    return (
        db.query(UserSkill)
        .filter(UserSkill.user_id == current_user.id)
        .all()
    )


@router.post("/users/me/skills", response_model=UserSkillOut, status_code=201)
def add_user_skill(
    body: AddUserSkill,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    skill = db.query(Skill).filter(Skill.id == body.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found in the catalog.")

    existing = (
        db.query(UserSkill)
        .filter(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_id == body.skill_id,
            UserSkill.type == body.type,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You already have this skill listed as '{body.type}'.",
        )

    us = UserSkill(
        user_id=current_user.id,
        skill_id=body.skill_id,
        type=body.type,
        proficiency_level=body.proficiency_level,
    )
    db.add(us)
    db.commit()
    db.refresh(us)
    return us


@router.delete("/users/me/skills/{skill_id}", status_code=204)
def remove_user_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    us = (
        db.query(UserSkill)
        .filter(UserSkill.id == skill_id, UserSkill.user_id == current_user.id)
        .first()
    )
    if not us:
        raise HTTPException(status_code=404, detail="Skill entry not found.")
    db.delete(us)
    db.commit()


# ── Availability ───────────────────────────────────────────────────

@router.get("/users/me/availability", response_model=List[AvailabilityOut])
def get_my_availability(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    return db.query(Availability).filter(Availability.user_id == current_user.id).all()


@router.post("/users/me/availability", response_model=AvailabilityOut, status_code=201)
def add_availability(
    body: AddAvailability,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    avail = Availability(
        user_id=current_user.id,
        day_of_week=body.day_of_week,
        start_time=body.start_time,
        end_time=body.end_time,
        mode=body.mode,
        timezone=body.timezone,
    )
    db.add(avail)
    db.commit()
    db.refresh(avail)
    return avail


@router.delete("/users/me/availability/{avail_id}", status_code=204)
def remove_availability(
    avail_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    a = (
        db.query(Availability)
        .filter(Availability.id == avail_id, Availability.user_id == current_user.id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Availability entry not found.")
    db.delete(a)
    db.commit()
