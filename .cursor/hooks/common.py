"""Shared helpers for project Cursor hooks. Scripts print one JSON object."""

import json
import sys
from pathlib import Path


def repo_root():
    here = Path(__file__).resolve().parent
    for candidate in (here, *here.parents):
        if (candidate / ".specify").is_dir():
            return candidate
    return here.parent.parent


def read_input():
    raw = sys.stdin.read()
    if not raw.strip():
        return None
    return json.loads(raw)


def emit(payload):
    sys.stdout.write(json.dumps(payload))
    sys.stdout.write("\n")


def allow():
    emit({"permission": "allow"})


def deny(user_message, agent_message=None):
    payload = {"permission": "deny", "user_message": user_message}
    if agent_message:
        payload["agent_message"] = agent_message
    emit(payload)


def resolve_repo_path(root, value):
    if value is None:
        return None
    text = str(value).strip()
    if text == "" or text.lower() == "none" or text.lower() == "null":
        return None
    path = Path(text)
    if not path.is_absolute():
        path = root / path
    return path
