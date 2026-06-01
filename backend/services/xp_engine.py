"""
XP Engine — scoring and level computation.

Level curve: level = floor((xp_total / 100) ^ 0.667) + 1, capped at 100.
This mirrors a gentle RPG curve: early levels come fast, later levels require sustained effort.

XP modifiers applied in order:
  1. Base reward (set on challenge)
  2. Speed bonus: finish in under 50% of time_limit → +20%
  3. Streak multiplier: applied to daily challenge only, scales with streak length
  4. First-attempt bonus: +10% if no wrong answers submitted
  5. Daily challenge bonus: fixed ×1.5
"""

import math


MAX_LEVEL = 100


def xp_to_level(xp_total: int) -> int:
    if xp_total <= 0:
        return 1
    level = math.floor((xp_total / 100) ** 0.667) + 1
    return min(MAX_LEVEL, level)


def xp_required_for_level(level: int) -> int:
    """Total cumulative XP needed to *reach* this level."""
    if level <= 1:
        return 0
    return math.ceil(100 * ((level - 1) ** (1 / 0.667)))


def xp_to_next_level(xp_total: int) -> int:
    current_level = xp_to_level(xp_total)
    if current_level >= MAX_LEVEL:
        return 0
    return xp_required_for_level(current_level + 1) - xp_total


def compute_xp_award(
    base_xp: int,
    *,
    time_taken_ms: int,
    time_limit_ms: int,
    streak_current: int,
    is_daily: bool,
    first_attempt: bool,
    hearts_used: int,
) -> int:
    score = float(base_xp)

    # Speed bonus
    if time_limit_ms > 0 and time_taken_ms <= time_limit_ms * 0.5:
        score *= 1.20

    # First-attempt bonus
    if first_attempt and hearts_used == 0:
        score *= 1.10

    # Daily bonus
    if is_daily:
        score *= 1.50

    # Streak multiplier: +1% per streak day, capped at +50%
    streak_multiplier = 1.0 + min(streak_current * 0.01, 0.50)
    score *= streak_multiplier

    # Hearts penalty: -5% per heart used (punishes excessive brute-forcing)
    heart_penalty = max(0.0, 1.0 - hearts_used * 0.05)
    score *= heart_penalty

    return max(1, round(score))  # always award at least 1 XP
