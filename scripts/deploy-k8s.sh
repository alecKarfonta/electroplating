#!/bin/bash
# Deploy PlateForge to Kubernetes via ~/git/system conventions.
# Thin wrapper — see system/scripts/deploy-app.sh for implementation.

set -euo pipefail

SYSTEM_ROOT="${SYSTEM_ROOT:-${HOME}/git/system}"
K8S_OVERLAY="${K8S_OVERLAY:-homelab}"

export K8S_OVERLAY
export KUBECONFIG="${KUBECONFIG:-${HOME}/.kube/config}"

if [ ! -x "${SYSTEM_ROOT}/scripts/deploy-app.sh" ]; then
    echo "System repo not found at ${SYSTEM_ROOT}" >&2
    echo "Clone or create ~/git/system first." >&2
    exit 1
fi

exec "${SYSTEM_ROOT}/scripts/deploy-app.sh" plateforge "${1:-deploy}"
