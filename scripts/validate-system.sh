#!/bin/bash
# Validate this repo meets the ~/git/system deploy contract.

set -euo pipefail

SYSTEM_ROOT="${SYSTEM_ROOT:-${HOME}/git/system}"
exec "${SYSTEM_ROOT}/scripts/validate-app.sh" plateforge
