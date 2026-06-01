"""
Streak Engine — pure business logic, no DB I/O.

Rules:
  - A streak day is any calendar day (in user's timezone) where >= 1 challenge is completed.
  - Streak increments when the user completes a challenge on the day immediately after their last activity.
  - Missing a day breaks the streak to 0 UNLESS a shield is consumed.
  - Shield sources: earned at milestone streaks (7, 30, 100 days), purchasable for 10 gems.
  - Max 2 shields banked at once. Shields auto-consume on the first missed day only.
  - Grace window: if the user missed *exactly* 1 day and has no shield, they may pay 2× XP cost
    (handled at the router level, not here).
"""

from dataclasses import dataclass
from datetime import date, timedelta


MILESTONE_STREAKS = {7, 30, 100, 365}


@dataclass(frozen=True)
class StreakState:
    current: int
    longest: int
    last_activity: date | None
    shields_banked: int
    shield_active: bool


@dataclass(frozen=True)
class StreakResult:
    new_streak: int
    new_longest: int
    new_shields_banked: int
    shield_consumed: bool
    broken: bool           # streak was reset to 1 (new start)
    milestone_reached: int | None  # streak value that hit a milestone, or None


def compute_streak(state: StreakState, activity_date: date) -> StreakResult:
    """
    Given the current streak state and a new activity date, return the updated streak.
    Does NOT mutate; returns a pure result value.
    """
    last = state.last_activity

    # Already logged today — idempotent
    if last == activity_date:
        return StreakResult(
            new_streak=state.current,
            new_longest=state.longest,
            new_shields_banked=state.shields_banked,
            shield_consumed=False,
            broken=False,
            milestone_reached=None,
        )

    gap = (activity_date - last).days if last else None

    shield_consumed = False
    broken = False
    new_streak: int

    if last is None or gap is None:
        # First ever activity
        new_streak = 1
    elif gap == 1:
        # Perfect continuation
        new_streak = state.current + 1
    elif gap == 2 and state.shields_banked > 0:
        # Missed exactly 1 day — auto-consume a shield
        new_streak = state.current + 1
        shield_consumed = True
    else:
        # Streak broken
        new_streak = 1
        broken = True

    new_shields_banked = (state.shields_banked - 1) if shield_consumed else state.shields_banked
    new_longest = max(state.longest, new_streak)

    milestone_reached = new_streak if new_streak in MILESTONE_STREAKS else None

    return StreakResult(
        new_streak=new_streak,
        new_longest=new_longest,
        new_shields_banked=new_shields_banked,
        shield_consumed=shield_consumed,
        broken=broken,
        milestone_reached=milestone_reached,
    )


def award_milestone_shield(streak: int, shields_banked: int, max_banked: int = 2) -> int:
    """Return updated shield count after a milestone is reached (capped at max_banked)."""
    if streak in MILESTONE_STREAKS:
        return min(max_banked, shields_banked + 1)
    return shields_banked
