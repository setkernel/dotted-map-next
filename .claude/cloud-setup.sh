#!/usr/bin/env bash
# Runs only in Claude Code cloud sessions (SessionStart hook checks CLAUDE_CODE_REMOTE).
# Per-session setup the cloud VM needs and a laptop already has: start services, seed local
# config from examples. Heavy system installs belong in the claude.ai environment's setup
# script instead (cached). Must be fast and must exit 0.
set -u
[ -f .dev.vars.example ] && [ ! -f .dev.vars ] && cp .dev.vars.example .dev.vars
[ -f .env.example ] && [ ! -f .env ] && cp .env.example .env
exit 0
