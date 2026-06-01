from datetime import date
from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.challenge import Challenge
from routers.auth import get_current_user
from models.user import User

router = APIRouter()


class ChallengeOut(BaseModel):
    id: UUID
    slug: str
    title: str
    type: str
    language: str
    difficulty: str
    xp_reward: int
    gem_reward: int
    time_limit_secs: int
    tags: list[str]
    is_daily: bool

    class Config:
        from_attributes = True


class ChallengeDetailOut(ChallengeOut):
    content: dict


@router.get("/daily", response_model=ChallengeDetailOut)
async def get_daily_challenge(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today = date.today()
    result = await db.execute(
        select(Challenge).where(
            and_(Challenge.is_daily == True, Challenge.daily_date == today, Challenge.is_active == True)  # noqa: E712
        )
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        # Fallback: any active debugging challenge
        result = await db.execute(
            select(Challenge).where(
                and_(Challenge.type == "debugging", Challenge.is_active == True)  # noqa: E712
            ).limit(1)
        )
        challenge = result.scalar_one_or_none()
    return challenge


@router.get("/", response_model=list[ChallengeOut])
async def list_challenges(
    language: str | None = Query(None),
    difficulty: Literal["rookie", "junior", "mid", "senior", "staff"] | None = Query(None),
    type: str | None = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    filters = [Challenge.is_active == True]  # noqa: E712
    if language:
        filters.append(Challenge.language == language)
    if difficulty:
        filters.append(Challenge.difficulty == difficulty)
    if type:
        filters.append(Challenge.type == type)

    result = await db.execute(select(Challenge).where(and_(*filters)).offset(offset).limit(limit))
    return result.scalars().all()


@router.get("/{challenge_id}", response_model=ChallengeDetailOut)
async def get_challenge(
    challenge_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    challenge = await db.get(Challenge, challenge_id)
    if not challenge or not challenge.is_active:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge
