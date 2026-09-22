from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from routers.auth import get_current_user

router = APIRouter()


class LeaderboardEntry(BaseModel):
    rank: int
    userId: str
    username: str
    xpTotal: int
    level: int
    streakCurrent: int
    isMe: bool


@router.get("/top", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).order_by(User.xp_total.desc()).limit(20)
    )
    users = result.scalars().all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            userId=str(u.id),
            username=u.username,
            xpTotal=u.xp_total,
            level=u.level,
            streakCurrent=u.streak_current,
            isMe=u.id == current_user.id,
        )
        for i, u in enumerate(users)
    ]
