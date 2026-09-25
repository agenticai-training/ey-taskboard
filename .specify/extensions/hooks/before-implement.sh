#!/usr/bin/env bash
# before_implement: spec and tasks must exist, and .specify/quality-gate.json
# must name the current feature directory. Exits non-zero otherwise.

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(CDPATH="" cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

OUT="$("$REPO_ROOT/.specify/scripts/bash/check-prerequisites.sh" --json --require-spec --require-tasks)"
printf '%s\n' "$OUT"

GATE="$REPO_ROOT/.specify/quality-gate.json"
if [[ ! -f "$GATE" ]]; then
    echo "ERROR: .specify/quality-gate.json is missing" >&2
    exit 1
fi

printf '%s\n' "$OUT" | python3 -c '
import json, os, sys
repo, gate_path = sys.argv[1], sys.argv[2]
raw = sys.stdin.read().strip().splitlines()
payload = None
for line in reversed(raw):
    line = line.strip()
    if line.startswith("{"):
        payload = json.loads(line)
        break
if payload is None or "FEATURE_DIR" not in payload:
    sys.stderr.write("ERROR: check-prerequisites did not return FEATURE_DIR\n")
    sys.exit(1)
with open(gate_path, encoding="utf-8") as handle:
    gate = json.load(handle)
named = gate.get("feature_directory") or ""

def rel(path):
    path = os.path.normpath(path)
    if os.path.isabs(path):
        path = os.path.relpath(path, repo)
    return path.replace("\\", "/").rstrip("/")

if not named or rel(named) != rel(payload["FEATURE_DIR"]):
    sys.stderr.write(
        "ERROR: quality gate feature_directory (%r) does not match %r\n"
        % (named, payload["FEATURE_DIR"])
    )
    sys.exit(1)
' "$REPO_ROOT" "$GATE"
