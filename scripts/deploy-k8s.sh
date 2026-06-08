#!/usr/bin/env bash
# Deploy plateforge via the homelab system app contract.

set -euo pipefail

SYSTEM_ROOT="${SYSTEM_ROOT:-${HOME}/git/system}"
exec "${SYSTEM_ROOT}/scripts/deploy-app.sh" plateforge "${1:-deploy}"
