import uuid
from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(Text, nullable=False, default="python")
    difficulty: Mapped[str] = mapped_column(Text, nullable=False, default="junior")
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    gem_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_limit_secs: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    tags: Mapped[list] = mapped_column(ARRAY(Text), nullable=False, default=list)
    is_daily: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    daily_date: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
