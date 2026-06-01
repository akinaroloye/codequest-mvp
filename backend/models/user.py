import uuid
from datetime import date, datetime
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_seed: Mapped[str] = mapped_column(Text, nullable=False, default="default")

    xp_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    gems: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hearts: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    hearts_last_refill_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    streak_current: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_longest: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_last_activity: Mapped[date | None] = mapped_column(Date)
    streak_shield_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    streak_shields_banked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    preferred_language: Mapped[str] = mapped_column(Text, nullable=False, default="python")
    timezone: Mapped[str] = mapped_column(Text, nullable=False, default="UTC")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    progress: Mapped[list["UserChallengeProgress"]] = relationship(back_populates="user", lazy="select")  # noqa: F821
    achievements: Mapped[list["Achievement"]] = relationship(back_populates="user", lazy="select")  # noqa: F821

    __table_args__ = (
        CheckConstraint("xp_total >= 0"),
        CheckConstraint("level >= 1"),
        CheckConstraint("gems >= 0"),
        CheckConstraint("hearts BETWEEN 0 AND 5"),
        CheckConstraint("streak_shields_banked BETWEEN 0 AND 2"),
    )
