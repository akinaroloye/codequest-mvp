from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/codequest"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    hearts_max: int = 5
    hearts_refill_hours: int = 4
    daily_xp_bonus_multiplier: float = 1.5
    streak_shield_cost_gems: int = 10
    streak_shield_max_banked: int = 2

    class Config:
        env_file = ".env"


settings = Settings()
