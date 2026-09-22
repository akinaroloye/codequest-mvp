-- CodeQuest MVP — PostgreSQL Schema
-- Run: psql -U postgres -d codequest -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE challenge_type AS ENUM (
  'syntax_completion',    -- fill in the blank(s) to complete valid code
  'debugging',            -- locate and fix a hidden logic/runtime bug
  'output_prediction',    -- given code, choose what it prints
  'performance_tradeoff', -- which implementation wins and why?
  'trace_execution'       -- manually step through; predict final state
);

CREATE TYPE difficulty_level AS ENUM (
  'rookie',   -- absolute beginner
  'junior',   -- 0-2 yrs
  'mid',      -- 2-5 yrs
  'senior',   -- 5+ yrs
  'staff'     -- system-design level
);

CREATE TYPE submission_status AS ENUM ('attempted', 'completed', 'skipped', 'timed_out');

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT UNIQUE NOT NULL,
  username               TEXT UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL DEFAULT '',
  avatar_seed            TEXT NOT NULL DEFAULT 'default',
  xp_total               INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  level                  INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  gems                   INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),   -- earnable premium currency
  hearts                 INTEGER NOT NULL DEFAULT 5 CHECK (hearts BETWEEN 0 AND 5),
  hearts_last_refill_at  TIMESTAMPTZ,
  streak_current         INTEGER NOT NULL DEFAULT 0 CHECK (streak_current >= 0),
  streak_longest         INTEGER NOT NULL DEFAULT 0 CHECK (streak_longest >= 0),
  streak_last_activity   DATE,
  streak_shield_active   BOOLEAN NOT NULL DEFAULT FALSE,
  streak_shields_banked  INTEGER NOT NULL DEFAULT 0 CHECK (streak_shields_banked BETWEEN 0 AND 2),
  preferred_language     TEXT NOT NULL DEFAULT 'python',
  timezone               TEXT NOT NULL DEFAULT 'UTC',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_streak ON users(streak_current DESC);
CREATE INDEX idx_users_xp ON users(xp_total DESC);

-- ─────────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────────

-- content JSONB shape by type:
--   syntax_completion  : { "prompt": str, "code_template": str, "blanks": [{"id": 0, "solutions": [str]}], "language": str }
--   debugging          : { "prompt": str, "buggy_code": str, "correct_code": str, "bug_hint": str, "bug_category": str }
--   output_prediction  : { "code": str, "options": [str], "correct_index": int, "explanation": str }
--   performance_tradeoff: { "scenario": str, "options": [{"label": str, "code": str}], "correct_index": int, "explanation": str }
--   trace_execution    : { "code": str, "variables": [{"name": str, "initial": any}], "steps": int, "expected_state": {} }

CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  type            challenge_type NOT NULL,
  language        TEXT NOT NULL DEFAULT 'python',
  difficulty      difficulty_level NOT NULL DEFAULT 'junior',
  xp_reward       INTEGER NOT NULL DEFAULT 10 CHECK (xp_reward > 0),
  gem_reward      INTEGER NOT NULL DEFAULT 0 CHECK (gem_reward >= 0),
  time_limit_secs INTEGER NOT NULL DEFAULT 300 CHECK (time_limit_secs > 0),
  content         JSONB NOT NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_daily        BOOLEAN NOT NULL DEFAULT FALSE,
  daily_date      DATE,                                -- set when is_daily = TRUE
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_needs_date CHECK (NOT is_daily OR daily_date IS NOT NULL)
);

CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_daily ON challenges(is_daily, daily_date) WHERE is_daily = TRUE;
CREATE INDEX idx_challenges_language ON challenges(language);
CREATE INDEX idx_challenges_difficulty ON challenges(difficulty);

-- ─────────────────────────────────────────────
-- USER PROGRESS
-- ─────────────────────────────────────────────

CREATE TABLE user_challenge_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    UUID NOT NULL REFERENCES challenges(id),
  status          submission_status NOT NULL DEFAULT 'attempted',
  attempts        INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
  best_score      NUMERIC(5, 2) CHECK (best_score BETWEEN 0 AND 100),
  time_taken_ms   INTEGER CHECK (time_taken_ms > 0),
  hearts_used     INTEGER NOT NULL DEFAULT 0 CHECK (hearts_used >= 0),
  xp_earned       INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

CREATE INDEX idx_progress_user ON user_challenge_progress(user_id);
CREATE INDEX idx_progress_completed ON user_challenge_progress(user_id, status) WHERE status = 'completed';

-- ─────────────────────────────────────────────
-- STREAK LOG  (one row per user per calendar day)
-- ─────────────────────────────────────────────

CREATE TABLE streak_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date         DATE NOT NULL,
  xp_earned             INTEGER NOT NULL DEFAULT 0,
  challenges_completed  INTEGER NOT NULL DEFAULT 0,
  shield_consumed       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_date)
);

CREATE INDEX idx_streak_log_user ON streak_log(user_id, activity_date DESC);

-- ─────────────────────────────────────────────
-- ACHIEVEMENTS
-- ─────────────────────────────────────────────

CREATE TABLE achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,   -- e.g. "streak_7", "level_10", "debugger_100"
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB NOT NULL DEFAULT '{}',
  UNIQUE (user_id, achievement_key)
);

CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ─────────────────────────────────────────────
-- LEADERBOARD  (materialised daily by background job)
-- ─────────────────────────────────────────────

CREATE TABLE leaderboard_snapshot (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank          INTEGER NOT NULL,
  xp_period     INTEGER NOT NULL,  -- XP earned within the leaderboard window
  UNIQUE (snapshot_date, user_id)
);

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-promote level when XP crosses threshold
CREATE OR REPLACE FUNCTION sync_user_level()
RETURNS TRIGGER AS $$
DECLARE new_level INTEGER;
BEGIN
  -- level = floor((xp / 100) ^ (2/3)) + 1  capped at 100
  new_level := LEAST(100, FLOOR(POWER(NEW.xp_total::FLOAT / 100.0, 0.667))::INTEGER + 1);
  IF new_level != OLD.level THEN
    NEW.level := new_level;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_level
  BEFORE UPDATE OF xp_total ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_level();
