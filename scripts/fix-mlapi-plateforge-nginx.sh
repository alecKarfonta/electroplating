#!/bin/bash
# Fix mlapi.us nginx routing for PlateForge.
# Canonical config lives in ~/git/system/nginx/apps/plateforge.conf

set -euo pipefail

SYSTEM_ROOT="${SYSTEM_ROOT:-${HOME}/git/system}"

if [ ! -f "${SYSTEM_ROOT}/scripts/install-nginx-app.sh" ]; then
    echo "System repo not found at ${SYSTEM_ROOT}" >&2
    exit 1
fi

exec sudo "${SYSTEM_ROOT}/scripts/install-nginx-app.sh" plateforge
