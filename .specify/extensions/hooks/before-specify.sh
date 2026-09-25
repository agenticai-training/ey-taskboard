#!/usr/bin/env bash
# before_specify: resolve a branch name without writing spec files, then check it out.
# Usage: before-specify.sh [--short-name <name>] <feature description>
# The feature description is the Jira summary. Echoes create-new-feature.sh JSON
# (BRANCH_NAME, FEATURE_NUM). Safe to run twice for the same summary.

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(CDPATH="" cd "$SCRIPT_DIR/../../.." && pwd)"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 [--short-name <name>] <feature description>" >&2
    exit 1
fi

JSON="$("$REPO_ROOT/.specify/scripts/bash/create-new-feature.sh" --dry-run --json "$@")"

BRANCH_NAME="$(printf '%s\n' "$JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["BRANCH_NAME"])')"
if [[ -z "$BRANCH_NAME" || "$BRANCH_NAME" == "null" ]]; then
    echo "ERROR: before-specify did not receive BRANCH_NAME" >&2
    exit 1
fi

cd "$REPO_ROOT"
current="$(git branch --show-current)"
if [[ "$current" != "$BRANCH_NAME" ]]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        git checkout "$BRANCH_NAME" >&2
    else
        git checkout -b "$BRANCH_NAME" >&2
    fi
fi

printf '%s\n' "$JSON"
