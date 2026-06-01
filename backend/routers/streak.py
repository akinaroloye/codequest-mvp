from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.progress import StreakLog
from routers.auth import get_current_user
from config import settings

router = APIRouter()


class StreakSummary(BaseModel):
    current: int
    longest: int
    shields_banked: int
    last_activity: str | None
    recent_days: list[dict]


class PurchaseShieldResponse(BaseModel):
    shields_banked: int
    gems_remaining: int


@router.get("/me", response_model=StreakSummary)
async def get_my_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logs_q = await db.execute(
        select(StreakLog)
        .where(StreakLog.user_id == current_user.id)
        .order_by(desc(StreakLog.activity_date))
        .limit(30)
    )
    logs = logs_q.scalars().all()

    return StreakSummary(
        current=current_user.streak_current,
        longest=current_user.streak_longest,
        shields_banked=current_user.streak_shields_banked,
        last_activity=str(current_user.streak_last_activity) if current_user.streak_last_activity else None,
        recent_days=[
            {
                "date": str(log.activity_date),
                "xp_earned": log.xp_earned,
                "challenges_completed": log.challenges_completed,
                "shield_consumed": log.shield_consumed,
            }
            for log in logs
        ],
    )


@router.post("/purchase-shield", response_model=PurchaseShieldResponse)
async def purchase_shield(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.shields_banked >= settings.streak_shield_max_banked:
        raise HTTPException(status_code=400, detail="Maximum shields already banked")
    if current_user.gems < settings.streak_shield_cost_gems:
        raise HTTPException(status_code=402, detail="Insufficient gems")

    current_user.gems -= settings.streak_shield_cost_gems
    current_user.streak_shields_banked += 1
    await db.commit()
    await db.refresh(current_user)

    return PurchaseShieldResponse(
        shields_banked=current_user.streak_shields_banked,
        gems_remaining=current_user.gems,
    )
