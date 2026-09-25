#!/usr/bin/env python3
"""Block reads of .env files. .env.example stays readable."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import allow, deny, read_input


def is_secret_env(file_path):
    name = Path(str(file_path or "")).name
    if name == ".env.example":
        return False
    return name == ".env" or name.startswith(".env.")


def main():
    try:
        payload = read_input()
    except json.JSONDecodeError:
        deny("File read blocked: hook input was not valid JSON.")
        return 0
    if not isinstance(payload, dict):
        deny("File read blocked: hook input was empty.")
        return 0

    file_path = payload.get("file_path") or ""
    if is_secret_env(file_path):
        deny(
            "Reading %s is blocked. Use .env.example and the framework configuration."
            % Path(str(file_path)).name
        )
        return 0

    allow()
    return 0


if __name__ == "__main__":
    sys.exit(main())
