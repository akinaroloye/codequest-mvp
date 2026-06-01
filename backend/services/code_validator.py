"""
Code Validator — validates challenge submissions without arbitrary remote execution.

Strategy by challenge type:
  - syntax_completion   : compare submitted tokens against accepted solution set (no execution needed)
  - debugging           : AST-diff or normalized string comparison of corrected code
  - output_prediction   : compare selected option index (pure data)
  - performance_tradeoff: compare selected option index (pure data)
  - trace_execution     : compare submitted final variable state against expected_state JSON

For syntax_completion we do NOT run code server-side at MVP. Instead, the mobile client
runs a lightweight WASM Python interpreter (Pyodide) in a sandboxed WebWorker so execution
is client-side and we only receive the result. This eliminates server-side sandbox complexity
while still validating correctness.

For debugging challenges, canonical solution comparison uses token-normalisation so minor
whitespace/formatting differences don't penalise the learner.
"""

import ast
import tokenize
import io
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ValidationResult:
    correct: bool
    score: float       # 0–100
    explanation: str
    hint: str | None


def validate_syntax_completion(content: dict, submission: dict) -> ValidationResult:
    """
    content.blanks: [{"id": 0, "solutions": ["x % 2 == 0", "not x % 2"]}]
    submission.answers: {0: "x % 2 == 0"}
    """
    blanks: list[dict] = content["blanks"]
    answers: dict[str, str] = {str(k): v.strip() for k, v in submission.get("answers", {}).items()}

    correct_count = 0
    for blank in blanks:
        bid = str(blank["id"])
        user_answer = answers.get(bid, "")
        accepted = [s.strip() for s in blank["solutions"]]
        if user_answer in accepted or _tokens_match(user_answer, accepted):
            correct_count += 1

    total = len(blanks)
    all_correct = correct_count == total
    score = (correct_count / total) * 100 if total else 0.0

    return ValidationResult(
        correct=all_correct,
        score=round(score, 2),
        explanation="All blanks correct." if all_correct else f"{correct_count}/{total} blanks correct.",
        hint=None if all_correct else "Check your syntax carefully — Python is case-sensitive.",
    )


def validate_debugging(content: dict, submission: dict) -> ValidationResult:
    correct_code: str = content["correct_code"]
    submitted_code: str = submission.get("code", "")

    if _tokens_match(submitted_code, [correct_code]):
        return ValidationResult(correct=True, score=100.0, explanation="Bug fixed correctly.", hint=None)

    # Partial credit: if submitted code parses as valid Python, award 30 points
    try:
        ast.parse(submitted_code)
        return ValidationResult(
            correct=False,
            score=30.0,
            explanation="Code is syntactically valid but does not match the expected fix.",
            hint=content.get("bug_hint"),
        )
    except SyntaxError as e:
        return ValidationResult(
            correct=False,
            score=0.0,
            explanation=f"Syntax error: {e.msg}",
            hint="Your code has a syntax error — check line numbers.",
        )


def validate_mcq(content: dict, submission: dict) -> ValidationResult:
    """For output_prediction and performance_tradeoff."""
    correct_idx: int = content["correct_index"]
    submitted_idx: int | None = submission.get("selected_index")

    if submitted_idx == correct_idx:
        return ValidationResult(
            correct=True, score=100.0,
            explanation=content["explanation"], hint=None
        )
    return ValidationResult(
        correct=False, score=0.0,
        explanation=content["explanation"],
        hint="Think about what Python evaluates first.",
    )


def validate_trace_execution(content: dict, submission: dict) -> ValidationResult:
    expected: dict[str, Any] = content["expected_state"]
    submitted: dict[str, Any] = submission.get("final_state", {})

    matches = sum(1 for k, v in expected.items() if submitted.get(str(k)) == v)
    total = len(expected)
    score = (matches / total * 100) if total else 0.0
    correct = matches == total

    return ValidationResult(
        correct=correct,
        score=round(score, 2),
        explanation="Execution trace correct." if correct else f"{matches}/{total} variables matched.",
        hint=None if correct else "Trace each assignment carefully. Remember Python evaluates right-hand side first.",
    )


def _tokens_match(candidate: str, accepted_list: list[str]) -> bool:
    """Compare after stripping to normalized token sequences (ignores whitespace/style)."""
    def tokenize_expr(src: str) -> list[str]:
        try:
            tokens = tokenize.generate_tokens(io.StringIO(src).readline)
            return [tok.string for tok in tokens if tok.type not in (tokenize.NEWLINE, tokenize.NL, tokenize.COMMENT, tokenize.ENCODING, tokenize.ENDMARKER)]
        except tokenize.TokenError:
            return [src.strip()]

    candidate_tokens = tokenize_expr(candidate)
    return any(candidate_tokens == tokenize_expr(accepted) for accepted in accepted_list)
