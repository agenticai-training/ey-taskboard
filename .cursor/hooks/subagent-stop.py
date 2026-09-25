#!/usr/bin/env python3
"""Remind the orchestrator to write the handoff before the next launch."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import emit, read_input

SPECIALISTS = {
    "taskboard-jira-reader",
    "taskboard-specify",
    "taskboard-clarify",
    "taskboard-plan",
    "taskboard-tasks",
    "taskboard-analyze",
    "taskboard-checklist",
    "taskboard-implement",
    "taskboard-test",
    "taskboard-ci",
}

PARALLEL = {"taskboard-analyze", "taskboard-checklist"}


def main():
    try:
        payload = read_input()
    except json.JSONDecodeError:
        emit({})
        return 0
    if not isinstance(payload, dict):
        emit({})
        return 0

    kind = str(payload.get("subagent_type") or "").strip()
    if kind not in SPECIALISTS:
        emit({})
        return 0
    if int(payload.get("loop_count") or 0) > 0:
        emit({})
        return 0

    status = str(payload.get("status") or "completed")
    if status != "completed":
        message = (
            "%s stopped with status %s. Write .specify/handoff.json with "
            "status failed and the blocker. Do not launch the next agent."
            % (kind, status)
        )
    elif kind in PARALLEL:
        message = (
            "%s finished. Wait until both taskboard-analyze and "
            "taskboard-checklist return ok. Then write .specify/quality-gate.json "
            "and .specify/handoff.json with step review-quality. Do not launch "
            "taskboard-implement until both specialists are ok and every named "
            "path exists."
            % kind
        )
    else:
        message = (
            "%s finished. Parse its return, confirm every named path exists, "
            "and write .specify/handoff.json. Do not launch the next agent "
            "until status is ok and the predecessor check passes."
            % kind
        )
    emit({"followup_message": message})
    return 0


if __name__ == "__main__":
    sys.exit(main())
