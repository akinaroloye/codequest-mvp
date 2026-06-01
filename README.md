# CodeQuest

A gamified coding practice app built along the same lines as Duolingo — daily challenges, a streak system, hearts/lives, XP and leveling. FastAPI backend, React Native (Expo) mobile client, PostgreSQL.

## Tech stack

**Backend**
- FastAPI + asyncpg + SQLAlchemy async
- PostgreSQL for persistent state (triggers auto-sync level from XP)
- Redis for per-user rate limiting and daily challenge caching
- JWT auth via python-jose / passlib

**Mobile**
- React Native + Expo (TypeScript), Expo Router v4
- Zustand for client state, React Query for server-state caching
- MMKV for fast encrypted local persistence (token, user profile)
- Skia for animations, Haptics for feedback

## Quick start

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL and REDIS_URL in .env
uvicorn main:app --reload --port 8000
```

**Database:**
```bash
psql -U postgres -c "CREATE DATABASE codequest;"
psql -U postgres -d codequest -f database/schema.sql
psql -U postgres -d codequest -f database/seed.sql
```

**Mobile:**
```bash
cd mobile
npm install
npx expo start --ios
```

## Data model

```
┌──────────────────────────────────────────────────────────────────────┐
│  users                                                               │
│  id UUID PK │ email │ username │ password_hash │ avatar_seed         │
│  xp_total INT │ level INT (auto-synced via trigger)                  │
│  gems INT │ hearts INT (0-5) │ hearts_last_refill_at                 │
│  streak_current │ streak_longest │ streak_last_activity DATE         │
│  streak_shield_active │ streak_shields_banked (0-2)                  │
│  preferred_language │ timezone                                       │
└──────────────────────────────────────────────────────────────────────┘
          │ 1:N                              │ 1:N
          ▼                                  ▼
┌────────────────────────┐      ┌─────────────────────────────────────┐
│  user_challenge_progress│      │  streak_log                         │
│  user_id FK │ challenge │      │  user_id FK │ activity_date DATE    │
│  status │ attempts     │      │  xp_earned │ challenges_completed   │
│  best_score │ time_ms  │      │  shield_consumed BOOL               │
│  hearts_used │ xp_earned│      └─────────────────────────────────────┘
└────────────────────────┘
          │ N:1
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│  challenges                                                          │
│  id │ slug │ title │ type (enum) │ language │ difficulty (enum)      │
│  xp_reward │ gem_reward │ time_limit_secs                           │
│  content JSONB  (shape varies by type)                               │
│  tags TEXT[] │ is_daily BOOL │ daily_date DATE                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Challenge types

Five challenge types, each stored as a different JSONB shape in `challenges.content`:

| Type | What it tests |
|------|--------------|
| `syntax_completion` | Fill in blanks in a code template |
| `debugging` | Spot and fix a bug in working-looking code |
| `output_prediction` | Predict exact stdout for a short snippet |
| `performance_tradeoff` | Choose the better implementation and explain why |
| `trace_execution` | Trace variable state through N steps without running the code |

The debugging and trace types deliberately focus on bugs where the code runs without crashing but produces wrong output (off-by-one, mutable defaults, wrong scope) since those require actually reading the code rather than pattern matching.

## Gamification

### Submit pipeline

```
POST /progress/submit
  │
  ├─► code_validator.py     -> ValidationResult (correct, score, hint)
  ├─► xp_engine.py          -> compute_xp_award() -> int
  ├─► streak_engine.py      -> compute_streak()   -> StreakResult
  ├─► DB write (single txn) -> users, user_challenge_progress, streak_log
  └─► Response              -> correct, xp_earned, streak, milestone
```

All three engines are pure functions (state in, new state out, no I/O) so they're easy to unit test independently of the database.

### XP formula

```
xp = base_xp
   × 1.20  (if completed in < 50% of time limit)
   × 1.10  (if first attempt, no hearts used)
   × 1.50  (if daily challenge)
   × (1.00 + min(streak × 0.01, 0.50))   # streak bonus, capped +50%
   × (1.00 - hearts_used × 0.05)          # heart penalty
```

Level curve: `level = floor((xp / 100) ^ 0.667) + 1`, capped at 100. Early levels come quickly; later ones require sustained daily activity.

### Streak rules

- Streak extends when the user completes at least one challenge on consecutive calendar days (user's local timezone)
- A gap of 2+ days resets the streak to 1
- If gap == 2 days and `shields_banked > 0`, a shield is auto-consumed and the streak continues
- Shields are earned at milestone streaks (7, 30, 100, 365 days), max 2 banked at once

### Hearts

5 hearts per session. Each wrong answer costs one. At 0 hearts, challenge submission is blocked until a 4-hour refill or a gem purchase. Hearts persist to the backend so they can't be reset by clearing local storage.

### Redis

```
rate_limit:{user_id}:{challenge_id}   ttl: 30s   value: attempt_count
daily_challenge:{YYYY-MM-DD}          ttl: 24h   value: challenge JSON
```

Redis is never a consistency dependency — if it's down the DB is the source of truth.

## Project structure

```
codequest-mvp/
├── backend/
│   ├── main.py                      # FastAPI app, lifespan, routers
│   ├── config.py                    # Settings via pydantic-settings
│   ├── database.py                  # SQLAlchemy async engine
│   ├── models/
│   │   ├── user.py
│   │   ├── challenge.py
│   │   └── progress.py              # UserChallengeProgress, StreakLog
│   ├── routers/
│   │   ├── auth.py                  # JWT register/login
│   │   ├── challenges.py            # GET /daily, GET /, GET /:id
│   │   ├── progress.py              # POST /submit (core game loop)
│   │   └── streak.py                # GET /me, POST /purchase-shield
│   └── services/
│       ├── streak_engine.py         # Pure function: compute_streak()
│       ├── xp_engine.py             # Pure function: compute_xp_award()
│       └── code_validator.py        # Token-normalised answer validation
├── mobile/
│   ├── App.tsx                      # Root: navigation, QueryClient, stores
│   └── src/
│       ├── types/index.ts
│       ├── theme/index.ts           # Design tokens
│       ├── store/
│       │   ├── useUserStore.ts      # Persisted user + token (MMKV)
│       │   └── useGameStore.ts      # Ephemeral challenge session state
│       ├── services/api.ts          # axios client + typed API wrappers
│       ├── screens/
│       │   ├── HomeScreen.tsx       # Daily challenge, streak, challenge list
│       │   └── ChallengeScreen.tsx  # Core challenge UI + submission
│       └── components/
│           ├── StreakBadge.tsx
│           ├── XPBar.tsx
│           └── ChallengeCard.tsx
└── database/
    ├── schema.sql                   # Full PostgreSQL schema with triggers
    └── seed.sql                     # 5 seeded challenges (one per type)
```

## What I learned

Structuring the gamification logic as pure functions made it much easier to reason about and test — the streak engine doesn't care how it gets called, so edge cases like first-ever activity, shield auto-consumption, and same-day idempotency are all covered by unit tests without touching the database. The single-transaction DB write (users + progress + streak_log in one commit) was the right call over separate writes, but getting SQLAlchemy async to do that cleanly took some reading. On the mobile side, the split between Zustand (ephemeral session state) and MMKV (persisted user/token) kept things from getting messy as the component tree grew.
