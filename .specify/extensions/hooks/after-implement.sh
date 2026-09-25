#!/usr/bin/env bash
# after_implement: re-run unit and API tests for stacks this story changed.
# Playwright is not part of this hook.

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(CDPATH="" cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

changed="$(
    git diff --name-only
    git diff --name-only --cached
    git ls-files --others --exclude-standard
    if git rev-parse --verify -q main >/dev/null 2>&1; then
        base="$(git merge-base HEAD main)"
        git diff --name-only "$base" HEAD
    elif git rev-parse --verify -q master >/dev/null 2>&1; then
        base="$(git merge-base HEAD master)"
        git diff --name-only "$base" HEAD
    fi
)"

run_stack() {
    local dir="$1"
    shift
    echo "RUN $* ($dir)"
    (cd "$REPO_ROOT/$dir" && "$@")
}

ran=0
if printf '%s\n' "$changed" | grep -q '^backend-dotnet/'; then
    run_stack backend-dotnet dotnet test
    ran=1
fi
if printf '%s\n' "$changed" | grep -q '^backend-python/'; then
    run_stack backend-python pytest
    ran=1
fi
if printf '%s\n' "$changed" | grep -q '^backend-java/'; then
    run_stack backend-java ./mvnw -B test
    ran=1
fi
if printf '%s\n' "$changed" | grep -q '^frontend/'; then
    run_stack frontend npm test -- --run
    ran=1
fi

if [[ "$ran" -eq 0 ]]; then
    echo "No changed stacks. Skipping unit and API tests."
fi
