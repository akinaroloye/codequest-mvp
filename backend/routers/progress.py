"""
POST /progress/submit — submit a challenge answer, award XP, update streak.
GET  /progress/me    — paginated list of user's completed challenges.
"""

from datetime import date, datetime, timezone
from uuid import UUID

import pytz
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.challenge import Challenge
from models.progress import UserChallengeProgress, StreakLog
from routers.auth import get_current_user
from services.code_validator import (
    validate_syntax_completion, validate_debugging,
    validate_mcq, validate_trace_execution,
)
from services.xp_engine import compute_xp_award
from services.streak_engine import StreakState, compute_streak, award_milestone_shield

router = APIRouter()


class SubmitRequest(BaseModel):
    challenge_id: UUID
    submission: dict        # type-specific payload (see code_validator.py)
    time_taken_ms: int
    client_timestamp: datetime | None = None


class SubmitResponse(BaseModel):
    correct: bool
    score: float
    xp_earned: int
    explanation: str
    hint: str | None
    streak_current: int
    streak_milestone: int | None
    xp_total: int
    level: int


@router.post("/submit", response_model=SubmitResponse)
async def submit_challenge(
    req: SubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    challenge = await db.get(Challenge, req.challenge_id)
    if not challenge or not challenge.is_active:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Validate answer
    validators = {
        "syntax_completion": validate_syntax_completion,
        "debugging": validate_debugging,
        "output_prediction": validate_mcq,
        "performance_tradeoff": validate_mcq,
        "trace_execution": validate_trace_execution,
    }
    result = validators[challenge.type](challenge.content, req.submission)

    # Upsert progress row
    progress_q = await db.execute(
        select(UserChallengeProgress).where(
            UserChallengeProgress.user_id == current_user.id,
            UserChallengeProgress.challenge_id == challenge.id,
        )
    )
    progress = progress_q.scalar_one_or_none()
    is_first_attempt = progress is None

    if progress is None:
        progress = UserChallengeProgress(
            user_id=current_user.id, challenge_id=challenge.id
        )
        db.add(progress)

    progress.attempts = (progress.attempts or 0) + 1
    if result.correct:
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)
    if progress.best_score is None or result.score > progress.best_score:
        progress.best_score = result.score
    progress.time_taken_ms = req.time_taken_ms

    # XP
    xp_earned = 0
    streak_milestone = None
    if result.correct:
        xp_earned = compute_xp_award(
            challenge.xp_reward,
            time_taken_ms=req.time_taken_ms,
            time_limit_ms=challenge.time_limit_secs * 1000,
            streak_current=current_user.streak_current,
            is_daily=challenge.is_daily,
            first_attempt=is_first_attempt,
            hearts_used=progress.hearts_used or 0,
        )
        progress.xp_earned = xp_earned
        current_user.xp_total += xp_earned

        # Streak
        tz = pytz.timezone(current_user.timezone)
        today = datetime.now(tz).date()
        streak_state = StreakState(
            current=current_user.streak_current,
            longest=current_user.streak_longest,
            last_activity=current_user.streak_last_activity,
            shields_banked=current_user.streak_shields_banked,
            shield_active=current_user.streak_shield_active,
        )
        streak_result = compute_streak(streak_state, today)

        current_user.streak_current = streak_result.new_streak
        current_user.streak_longest = streak_result.new_longest
        current_user.streak_shields_banked = streak_result.new_shields_banked
        current_user.streak_last_activity = today
        streak_milestone = streak_result.milestone_reached

        if streak_milestone:
            new_shields = award_milestone_shield(
                streak_milestone, current_user.streak_shields_banked
            )
            current_user.streak_shields_banked = new_shields

        # Upsert streak_log
        log_q = await db.execute(
            select(StreakLog).where(
                StreakLog.user_id == current_user.id,
                StreakLog.activity_date == today,
            )
        )
        log = log_q.scalar_one_or_none()
        if log is None:
            log = StreakLog(user_id=current_user.id, activity_date=today)
            db.add(log)
        log.xp_earned = (log.xp_earned or 0) + xp_earned
        log.challenges_completed = (log.challenges_completed or 0) + 1

    await db.commit()
    await db.refresh(current_user)

    return SubmitResponse(
        correct=result.correct,
        score=result.score,
        xp_earned=xp_earned,
        explanation=result.explanation,
        hint=result.hint,
        streak_current=current_user.streak_current,
        streak_milestone=streak_milestone,
        xp_total=current_user.xp_total,
        level=current_user.level,
    )
