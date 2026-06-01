-- CodeQuest — Seed data: one challenge per type to demonstrate content schema

INSERT INTO challenges (slug, title, type, language, difficulty, xp_reward, gem_reward, time_limit_secs, content, tags, is_daily, daily_date) VALUES

-- 1. syntax_completion
('py-list-comprehension-basic', 'Filter Evens with List Comprehension', 'syntax_completion', 'python', 'junior', 15, 0, 120,
'{
  "prompt": "Complete the list comprehension to return only even numbers from `nums`.",
  "code_template": "nums = [1, 2, 3, 4, 5, 6]\nevens = [x for x in nums if ___]",
  "blanks": [{"id": 0, "placeholder": "___", "solutions": ["x % 2 == 0", "not x % 2"]}],
  "language": "python"
}'::jsonb,
ARRAY['python', 'list-comprehension', 'filtering'], FALSE, NULL),

-- 2. debugging (AI-atrophy: off-by-one + mutable default arg — classic traps)
('py-debug-mutable-default', 'Debug the Accumulator', 'debugging', 'python', 'mid', 25, 1, 240,
'{
  "prompt": "This function should return a fresh list each call, but it keeps growing. Find and fix the bug.",
  "buggy_code": "def append_item(item, result=[]):\n    result.append(item)\n    return result\n\nprint(append_item(1))  # [1]\nprint(append_item(2))  # expected [2], got [1, 2]",
  "correct_code": "def append_item(item, result=None):\n    if result is None:\n        result = []\n    result.append(item)\n    return result",
  "bug_hint": "Think about when Python evaluates default argument values.",
  "bug_category": "mutable_default_argument"
}'::jsonb,
ARRAY['python', 'debugging', 'gotchas', 'ai-atrophy'], TRUE, CURRENT_DATE),

-- 3. output_prediction
('py-short-circuit-eval', 'What Does This Print?', 'output_prediction', 'python', 'senior', 30, 2, 60,
'{
  "code": "x = 0\nprint(x and 10/x)\nprint(x or ''fallback'')",
  "options": ["0\\nfallback", "ZeroDivisionError", "False\\nfallback", "0\\n0"],
  "correct_index": 0,
  "explanation": "Python short-circuits `and`: if the left side is falsy (0), it returns the left side immediately without evaluating `10/x`. `or` returns the first truthy value, which is the string ''fallback''."
}'::jsonb,
ARRAY['python', 'short-circuit', 'output-prediction', 'ai-atrophy'], FALSE, NULL),

-- 4. performance_tradeoff
('py-set-vs-list-lookup', 'O(1) vs O(n) Lookup', 'performance_tradeoff', 'python', 'mid', 20, 1, 90,
'{
  "scenario": "You need to check membership in a collection of 1 million unique IDs, called 10 000 times per second. Which implementation do you ship?",
  "options": [
    {"label": "Option A: List", "code": "ids = [1, 2, 3, ...]  # 1M items\nif target_id in ids: ..."},
    {"label": "Option B: Set", "code": "ids = {1, 2, 3, ...}  # 1M items\nif target_id in ids: ..."}
  ],
  "correct_index": 1,
  "explanation": "List `in` is O(n) — it scans every element. Set `in` is O(1) average due to hash-table storage. At 1M items and 10k checks/s, Option A burns ~10^10 comparisons/s; Option B is essentially free."
}'::jsonb,
ARRAY['python', 'performance', 'data-structures', 'big-o', 'ai-atrophy'], FALSE, NULL),

-- 5. trace_execution
('py-closure-counter', 'Trace the Closure', 'trace_execution', 'python', 'senior', 35, 2, 180,
'{
  "code": "def make_counter():\n    count = 0\n    def increment(n=1):\n        nonlocal count\n        count += n\n        return count\n    return increment\n\nc1 = make_counter()\nc2 = make_counter()\nprint(c1())    # step 1\nprint(c1(5))   # step 2\nprint(c2())    # step 3\nprint(c1())    # step 4",
  "variables": [
    {"name": "c1_count", "initial": 0},
    {"name": "c2_count", "initial": 0}
  ],
  "steps": 4,
  "expected_state": {"step1": 1, "step2": 6, "step3": 1, "step4": 7},
  "explanation": "Each call to make_counter() creates an independent closure. c1 and c2 do not share state. nonlocal allows mutation of the enclosing scope variable."
}'::jsonb,
ARRAY['python', 'closures', 'nonlocal', 'trace', 'ai-atrophy'], FALSE, NULL);
