#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block rm commands (rm, rm -rf, etc.) — require manual approval
if echo "$COMMAND" | grep -qE '(^|[;&|]\s*)rm\s'; then
  cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"rm commands require approval"}}
EOF
  exit 0
fi

# Allow all other bash commands
cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"bash auto-approved"}}
EOF
exit 0
