"""
Matching logic — Section 11 scoring: M = 0.5*S + 0.2*A + 0.2*T + 0.1*L
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import User, UserSkill, Availability, Skill
from app.schemas import MatchResult, UserPublic, SkillOut
from app.auth import get_current_user
from app.config import (
    MATCH_WEIGHT_SKILL, MATCH_WEIGHT_AVAILABILITY,
    MATCH_WEIGHT_TEACHING_LEVEL, MATCH_WEIGHT_MODE,
)

router = APIRouter(prefix="/matches", tags=["Matching"])


def _compute_skill_score(my_learn: dict, my_teach: dict, their_teach: dict, their_learn: dict) -> float:
    """
    S = skill compatibility (0-100).
    Full reciprocal match (they teach what I want AND I teach what they want) = 100.
    One-way match = 50.
    """
    they_teach_what_i_need = bool(set(my_learn.keys()) & set(their_teach.keys()))
    i_teach_what_they_need = bool(set(my_teach.keys()) & set(their_learn.keys()))

    if they_teach_what_i_need and i_teach_what_they_need:
        return 100.0
    elif they_teach_what_i_need or i_teach_what_they_need:
        return 50.0
    return 0.0


def _compute_availability_score(my_avail: list, their_avail: list) -> float:
    """
    A = availability overlap (0-100).
    Count shared day+time overlaps.
    """
    if not my_avail or not their_avail:
        return 50.0  # unknown = neutral

    my_slots = {(a.day_of_week, a.start_time, a.end_time) for a in my_avail}
    their_slots = {(a.day_of_week, a.start_time, a.end_time) for a in their_avail}

    # Simple: count shared days
    my_days = {a.day_of_week for a in my_avail}
    their_days = {a.day_of_week for a in their_avail}
    shared_days = my_days & their_days

    if not my_days:
        return 50.0
    return min(100.0, (len(shared_days) / max(len(my_days), 1)) * 100)


def _compute_teaching_level_score(my_learn: dict, their_teach: dict) -> float:
    """
    T = teaching-level compatibility (0-100).
    Candidate proficiency should be >= requester's level.
    """
    overlapping = set(my_learn.keys()) & set(their_teach.keys())
    if not overlapping:
        return 50.0  # neutral

    scores = []
    for skill_id in overlapping:
        my_level = my_learn[skill_id]
        their_level = their_teach[skill_id]
        if their_level >= my_level:
            gap = their_level - my_level
            # Ideal gap is 20-40 points; too close or too far is less ideal
            if 20 <= gap <= 40:
                scores.append(100.0)
            elif gap < 20:
                scores.append(70.0)
            else:
                scores.append(60.0)
        else:
            scores.append(20.0)  # candidate below requester's level

    return sum(scores) / len(scores) if scores else 50.0


def _compute_mode_score(my_avail: list, their_avail: list) -> float:
    """
    L = mode compatibility (0-100).
    """
    if not my_avail or not their_avail:
        return 50.0

    my_modes = {a.mode for a in my_avail}
    their_modes = {a.mode for a in their_avail}
    shared = my_modes & their_modes

    if shared:
        return 100.0
    return 20.0


@router.get("", response_model=List[MatchResult])
def get_matches(
    skill: Optional[str] = Query(None, description="Filter by skill name"),
    mode: Optional[str] = Query(None, description="Filter by mode (online/in-person)"),
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    # Build current user's skill maps
    my_skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    my_learn = {us.skill_id: us.proficiency_level for us in my_skills if us.type == "learn"}
    my_teach = {us.skill_id: us.proficiency_level for us in my_skills if us.type == "teach"}
    my_avail = db.query(Availability).filter(Availability.user_id == current_user.id).all()

    if not my_learn and not my_teach:
        return []

    # Get all other users
    candidates = db.query(User).filter(User.id != current_user.id).all()
    results = []

    for candidate in candidates:
        c_skills = db.query(UserSkill).filter(UserSkill.user_id == candidate.id).all()
        c_teach = {us.skill_id: us.proficiency_level for us in c_skills if us.type == "teach"}
        c_learn = {us.skill_id: us.proficiency_level for us in c_skills if us.type == "learn"}
        c_avail = db.query(Availability).filter(Availability.user_id == candidate.id).all()

        # Compute sub-scores
        s = _compute_skill_score(my_learn, my_teach, c_teach, c_learn)
        a = _compute_availability_score(my_avail, c_avail)
        t = _compute_teaching_level_score(my_learn, c_teach)
        l = _compute_mode_score(my_avail, c_avail)

        score = (
            MATCH_WEIGHT_SKILL * s +
            MATCH_WEIGHT_AVAILABILITY * a +
            MATCH_WEIGHT_TEACHING_LEVEL * t +
            MATCH_WEIGHT_MODE * l
        )

        if score < 10:
            continue

        # Apply filters
        if skill:
            skill_obj = db.query(Skill).filter(Skill.name.ilike(f"%{skill}%")).first()
            if skill_obj:
                if skill_obj.id not in c_teach and skill_obj.id not in c_learn:
                    continue

        if mode and c_avail:
            c_modes = {av.mode for av in c_avail}
            if mode not in c_modes:
                continue

        teaches = [
            db.query(Skill).get(sid) for sid in c_teach.keys()
        ]
        wants = [
            db.query(Skill).get(sid) for sid in c_learn.keys()
        ]

        shared_day_count = len(
            {av.day_of_week for av in my_avail} & {av.day_of_week for av in c_avail}
        )

        results.append(MatchResult(
            user=UserPublic.model_validate(candidate),
            score=round(score, 1),
            teaches=[SkillOut.model_validate(s) for s in teaches if s],
            wants_to_learn=[SkillOut.model_validate(s) for s in wants if s],
            shared_availability=shared_day_count,
        ))

    results.sort(key=lambda r: r.score, reverse=True)
    return results
