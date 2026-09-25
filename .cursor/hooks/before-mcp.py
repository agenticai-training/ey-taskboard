#!/usr/bin/env python3
"""Allow only the Jira read tools on the Atlassian server."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import allow, deny, read_input

ALLOWED_TOOLS = {"getAccessibleAtlassianResources", "getJiraIssue"}


def tool_basename(name):
    text = str(name or "").strip()
    for separator in ("/", ":"):
        if separator in text:
            text = text.rsplit(separator, 1)[-1]
    return text


def is_atlassian(payload):
    server = str(payload.get("mcp_server_name") or "")
    url = str(payload.get("url") or payload.get("mcp_server_url") or "")
    return "atlassian" in ("%s %s" % (server, url)).lower()


def main():
    try:
        payload = read_input()
    except json.JSONDecodeError:
        deny(
            "MCP call blocked: hook input was not valid JSON.",
            "beforeMCPExecution could not read the tool call.",
        )
        return 0
    if not isinstance(payload, dict):
        deny(
            "MCP call blocked: hook input was empty.",
            "beforeMCPExecution received no tool call.",
        )
        return 0

    server = str(payload.get("mcp_server_name") or "").strip()
    url = str(payload.get("url") or payload.get("mcp_server_url") or "").strip()
    if not server and not url:
        deny(
            "MCP call blocked: the server name was missing.",
            "Identify mcp_server_name before calling an MCP tool.",
        )
        return 0

    if not is_atlassian(payload):
        allow()
        return 0

    tool = tool_basename(payload.get("tool_name"))
    if tool in ALLOWED_TOOLS:
        allow()
        return 0

    deny(
        "Blocked Atlassian tool %s. This workflow may only call getAccessibleAtlassianResources and getJiraIssue."
        % (tool or "(unnamed)"),
        "Do not create, edit, transition, or delete Jira or Confluence content.",
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
