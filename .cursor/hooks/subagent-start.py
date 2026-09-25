#!/usr/bin/env python3
"""Deny a taskboard specialist unless the handoff names its predecessor."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import allow, deny, read_input, repo_root, resolve_repo_path

# step required in .specify/handoff.json before this specialist may start
PREDECESSOR = {
    "taskboard-specify": "taskboard-jira-reader",
    "taskboard-clarify": "taskboard-specify",
    "taskboard-plan": "review-clarify",
    "taskboard-tasks": "taskboard-plan",
    "taskboard-analyze": "taskboard-tasks",
    "taskboard-checklist": "taskboard-tasks",
    "taskboard-implement": "review-quality",
    "taskboard-test": "taskboard-implement",
}

PATH_FIELD = {
    "taskboard-specify": "brief_path",
    "taskboard-clarify": "spec_file",
    "taskboard-plan": "spec_file",
    "taskboard-tasks": "plan_file",
    "taskboard-analyze": "tasks_file",
    "taskboard-checklist": "tasks_file",
    "taskboard-implement": "tasks_file",
}


def tests_passed(tests):
    if tests is None:
        return False
    if isinstance(tests, str):
        tests = [tests]
    if not isinstance(tests, list):
        return False
    for entry in tests:
        text = str(entry).strip()
        lowered = text.lower()
        if lowered in ("", "none"):
            continue
        result = lowered
        for separator in ("—", "–", " - "):
            if separator in text:
                result = text.rsplit(separator, 1)[-1].strip().lower()
                break
        if result not in ("pass", "passed", "ok"):
            return False
    return True


def main():
    try:
        payload = read_input()
    except json.JSONDecodeError:
        deny("Subagent start blocked: hook input was not valid JSON.")
        return 0
    if not isinstance(payload, dict):
        deny("Subagent start blocked: hook input was empty.")
        return 0

    kind = str(payload.get("subagent_type") or "").strip()
    expected = PREDECESSOR.get(kind)
    if expected is None:
        allow()
        return 0

    root = repo_root()
    handoff_path = root / ".specify" / "handoff.json"
    if not handoff_path.is_file():
        deny(
            "Blocked %s: .specify/handoff.json is missing." % kind,
            "Write the handoff for step %s before launching %s." % (expected, kind),
        )
        return 0

    try:
        handoff = json.loads(handoff_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        deny("Blocked %s: .specify/handoff.json could not be read." % kind)
        return 0

    status = handoff.get("status")
    step = handoff.get("step")
    if status != "ok" or step != expected:
        deny(
            "Blocked %s: handoff status is %r and step is %r; expected ok and %s."
            % (kind, status, step, expected),
            "Do not launch %s until the predecessor gate has passed." % kind,
        )
        return 0

    field = PATH_FIELD.get(kind)
    if field:
        path = resolve_repo_path(root, handoff.get(field))
        if path is None or not path.is_file():
            deny(
                "Blocked %s: handoff %s does not point at a file." % (kind, field),
                "Check %s exists before launching %s." % (field, kind),
            )
            return 0
        if kind == "taskboard-plan" and "NEEDS CLARIFICATION" in path.read_text(encoding="utf-8"):
            deny(
                "Blocked taskboard-plan: spec.md still contains NEEDS CLARIFICATION.",
                "Finish review-clarify before launching taskboard-plan.",
            )
            return 0

    if kind == "taskboard-implement":
        stamp = resolve_repo_path(root, handoff.get("quality_stamp"))
        if stamp is None or not stamp.is_file():
            deny(
                "Blocked taskboard-implement: quality_stamp is missing.",
                "Write .specify/quality-gate.json and record it as quality_stamp.",
            )
            return 0

    if kind == "taskboard-test" and not tests_passed(handoff.get("tests")):
        deny(
            "Blocked taskboard-test: a handoff test entry did not pass.",
            "Pass review-implement before launching taskboard-test.",
        )
        return 0

    allow()
    return 0


if __name__ == "__main__":
    sys.exit(main())
